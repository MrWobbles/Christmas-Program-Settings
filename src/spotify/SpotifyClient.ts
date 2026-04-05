/**
 * Spotify Web API Client using PKCE Authorization Flow
 *
 * Setup:
 * 1. Create an app at https://developer.spotify.com/dashboard
 * 2. Add redirect URI: http://localhost:4173/room4.html (or your production URL)
 * 3. Copy Client ID to SPOTIFY_CLIENT_ID below
 */

// ⚠️ Replace with your Spotify App Client ID
const SPOTIFY_CLIENT_ID = 'f593d2191f0a44c99ff254d958e77a8d';

// Redirect URI must match what's configured in Spotify Dashboard
// Spotify requires 127.0.0.1 (not localhost) for local development
// Dev server always runs on port 5173
const REDIRECT_URI = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://127.0.0.1:5173/src/html/spotify.html'
  : 'https://shadowoftheharvest.church/ChristmasProgram/spotify.html';

const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private'
].join(' ');

const TOKEN_KEY = 'spotify_access_token';
const TOKEN_EXPIRY_KEY = 'spotify_token_expiry';
const VERIFIER_KEY = 'spotify_code_verifier';

export interface SpotifyTrack {
  name: string;
  artists: string[];
  album: string;
  albumArt: string | null;
  duration: number;
  progress: number;
  isPlaying: boolean;
  uri: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
  uri: string;
  isOwned: boolean;
  isCollaborative: boolean;
}

export interface SpotifyQueueTrack {
  name: string;
  artists: string[];
  albumArt: string | null;
  uri: string;
}

export interface SpotifyState {
  isAuthenticated: boolean;
  isPlaying: boolean;
  track: SpotifyTrack | null;
  error: string | null;
}

class SpotifyClient {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private listeners: Set<(state: SpotifyState) => void> = new Set();
  private pollInterval: number | null = null;
  private currentState: SpotifyState = {
    isAuthenticated: false,
    isPlaying: false,
    track: null,
    error: null
  };

  constructor() {
    this.loadStoredToken();
  }

  /**
   * Generate a cryptographically random string for PKCE
   */
  private generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], '');
  }

  /**
   * Generate SHA-256 hash for PKCE code challenge
   */
  private async sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
  }

  /**
   * Base64 URL encode for PKCE
   */
  private base64UrlEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let str = '';
    bytes.forEach(byte => str += String.fromCharCode(byte));
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Load token from localStorage
   */
  private loadStoredToken(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

    if (token && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() < expiryTime) {
        this.accessToken = token;
        this.tokenExpiry = expiryTime;
        this.updateState({ isAuthenticated: true, error: null });
      } else {
        // Token expired, clear it
        this.clearToken();
      }
    }
  }

  /**
   * Save token to localStorage
   */
  private saveToken(token: string, expiresIn: number): void {
    this.accessToken = token;
    this.tokenExpiry = Date.now() + (expiresIn * 1000);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, this.tokenExpiry.toString());
  }

  /**
   * Clear stored token
   */
  private clearToken(): void {
    this.accessToken = null;
    this.tokenExpiry = 0;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }

  /**
   * Update state and notify listeners
   */
  private updateState(partial: Partial<SpotifyState>): void {
    this.currentState = { ...this.currentState, ...partial };
    this.listeners.forEach(listener => listener(this.currentState));
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: SpotifyState) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.currentState);
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current state
   */
  getState(): SpotifyState {
    return this.currentState;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null && Date.now() < this.tokenExpiry;
  }

  /**
   * Redirect to Spotify authorization
   */
  async authorize(): Promise<void> {
    if (SPOTIFY_CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
      this.updateState({
        error: 'Please configure SPOTIFY_CLIENT_ID in SpotifyClient.ts'
      });
      return;
    }

    const codeVerifier = this.generateRandomString(64);
    localStorage.setItem(VERIFIER_KEY, codeVerifier);

    const hashed = await this.sha256(codeVerifier);
    const codeChallenge = this.base64UrlEncode(hashed);

    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      show_dialog: 'true' // Force re-authorization to get new scopes
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  /**
   * Handle OAuth callback - exchange code for token
   */
  async handleCallback(): Promise<boolean> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      this.updateState({ error: `Authorization failed: ${error}` });
      return false;
    }

    if (!code) {
      return false; // No callback to handle
    }

    const codeVerifier = localStorage.getItem(VERIFIER_KEY);
    if (!codeVerifier) {
      this.updateState({ error: 'Missing code verifier' });
      return false;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          code_verifier: codeVerifier
        })
      });

      if (!response.ok) {
        throw new Error('Token exchange failed');
      }

      const data = await response.json();
      console.log('Token exchange successful. Scopes granted:', data.scope);
      this.saveToken(data.access_token, data.expires_in);
      localStorage.removeItem(VERIFIER_KEY);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);

      this.updateState({ isAuthenticated: true, error: null });
      return true;
    } catch (err) {
      this.updateState({ error: 'Failed to exchange authorization code' });
      return false;
    }
  }

  /**
   * Logout - clear token and stop polling
   */
  logout(): void {
    this.stopPolling();
    this.clearToken();
    this.updateState({
      isAuthenticated: false,
      isPlaying: false,
      track: null,
      error: null
    });
  }

  /**
   * Fetch currently playing track
   */
  async fetchNowPlaying(): Promise<SpotifyTrack | null> {
    if (!this.isAuthenticated()) {
      this.updateState({ isAuthenticated: false });
      return null;
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      // 204 = no content (nothing playing)
      if (response.status === 204) {
        this.updateState({ isPlaying: false, track: null });
        return null;
      }

      // 401 = unauthorized (token expired)
      if (response.status === 401) {
        this.clearToken();
        this.updateState({ isAuthenticated: false, error: 'Session expired' });
        return null;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Only handle tracks (not podcasts, etc.)
      if (data.currently_playing_type !== 'track' || !data.item) {
        this.updateState({ isPlaying: false, track: null });
        return null;
      }

      const track: SpotifyTrack = {
        name: data.item.name,
        artists: data.item.artists.map((a: any) => a.name),
        album: data.item.album.name,
        albumArt: data.item.album.images[0]?.url || null,
        duration: data.item.duration_ms,
        progress: data.progress_ms || 0,
        isPlaying: data.is_playing,
        uri: data.item.uri
      };

      this.updateState({
        isPlaying: data.is_playing,
        track,
        error: null
      });

      return track;
    } catch (err) {
      console.error('Failed to fetch now playing:', err);
      this.updateState({ error: 'Failed to fetch playback' });
      return null;
    }
  }

  /**
   * Start polling for currently playing track
   */
  startPolling(intervalMs: number = 3000): void {
    this.stopPolling();

    // Fetch immediately
    this.fetchNowPlaying();

    // Then poll at interval
    this.pollInterval = window.setInterval(() => {
      this.fetchNowPlaying();
    }, intervalMs);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Skip to next track
   */
  async nextTrack(): Promise<void> {
    if (!this.isAuthenticated()) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      // Fetch updated track after a brief delay
      setTimeout(() => this.fetchNowPlaying(), 500);
    } catch (err) {
      console.error('Failed to skip track:', err);
    }
  }

  /**
   * Skip to previous track
   */
  async previousTrack(): Promise<void> {
    if (!this.isAuthenticated()) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      // Fetch updated track after a brief delay
      setTimeout(() => this.fetchNowPlaying(), 500);
    } catch (err) {
      console.error('Failed to go to previous track:', err);
    }
  }

  /**
   * Get user's playlists
   */
  async getPlaylists(limit: number = 50): Promise<SpotifyPlaylist[]> {
    if (!this.isAuthenticated()) return [];

    try {
      // First get the current user's ID
      const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to get user: ${userResponse.status}`);
      }

      const userData = await userResponse.json();
      const userId = userData.id;

      const response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw playlists response:', data.items?.map((p: any) => ({
        name: p.name,
        id: p.id,
        tracks: p.tracks,
        owner: p.owner?.id
      })));
      return data.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.images?.[0]?.url || null,
        trackCount: item.tracks?.total || 0,
        uri: item.uri,
        isOwned: item.owner?.id === userId,
        isCollaborative: item.collaborative === true
      }));
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
      return [];
    }
  }

  /**
   * Get playback queue
   */
  async getQueue(): Promise<SpotifyQueueTrack[]> {
    if (!this.isAuthenticated()) return [];

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/queue', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return (data.queue || []).slice(0, 10).map((item: any) => ({
        name: item.name,
        artists: item.artists?.map((a: any) => a.name) || [],
        albumArt: item.album?.images?.[2]?.url || item.album?.images?.[0]?.url || null,
        uri: item.uri
      }));
    } catch (err) {
      console.error('Failed to fetch queue:', err);
      return [];
    }
  }

  /**
   * Play a playlist
   */
  async playPlaylist(playlistUri: string): Promise<void> {
    if (!this.isAuthenticated()) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          context_uri: playlistUri
        })
      });
      // Fetch updated track after a brief delay
      setTimeout(() => this.fetchNowPlaying(), 500);
    } catch (err) {
      console.error('Failed to play playlist:', err);
    }
  }

  /**
   * Check if a track is in a playlist
   */
  async isTrackInPlaylist(playlistId: string, trackUri: string): Promise<boolean> {
    if (!this.isAuthenticated()) return false;

    try {
      // Try fetching playlist with tracks included (different endpoint pattern)
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}?fields=tracks.items(track(uri))`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Cannot fetch playlist with tracks:', response.status, JSON.stringify(errData, null, 2));
        return false;
      }

      const data = await response.json();
      console.log('Playlist tracks count:', data.tracks?.items?.length);

      const found = data.tracks?.items?.some((item: any) => item.track?.uri === trackUri) || false;
      return found;
    } catch (err) {
      console.error('Failed to check track in playlist:', err);
      return false;
    }
  }

  /**
   * Add a track to a playlist
   */
  async addTrackToPlaylist(playlistId: string, trackUri: string): Promise<boolean> {
    if (!this.isAuthenticated()) return false;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: [trackUri]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Add track failed:', response.status, JSON.stringify(errorData, null, 2));
        console.error('Token being used:', this.accessToken?.substring(0, 20) + '...');
      }

      return response.ok;
    } catch (err) {
      console.error('Failed to add track to playlist:', err);
      return false;
    }
  }

  /**
   * Remove a track from a playlist
   */
  async removeTrackFromPlaylist(playlistId: string, trackUri: string): Promise<boolean> {
    if (!this.isAuthenticated()) return false;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tracks: [{ uri: trackUri }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Remove track failed:', response.status, errorData);
      }

      return response.ok;
    } catch (err) {
      console.error('Failed to remove track from playlist:', err);
      return false;
    }
  }
}

// Export singleton instance
export const spotifyClient = new SpotifyClient();
