/**
 * Spotify Player Page
 * Displays the currently playing track from the user's Spotify account
 * with selectable room themes
 */

import { spotifyClient, SpotifyState, SpotifyPlaylist, SpotifyQueueTrack } from '../spotify/SpotifyClient';
import { calendarClient, CalendarEvent } from '../calendar/CalendarClient';

// Theme configuration
const THEME_KEY = 'spotify_theme';
const THEMES = ['stars', 'emmanuel', 'twilight', 'faithful', 'joy', 'silent'] as const;
type Theme = typeof THEMES[number];

// Star class for background animation
interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speed: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

// Stars animation
class StarsBackground {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private animationId: number | null = null;
  private isActive = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    this.createStars();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.createStars();
  }

  private createStars(): void {
    const numStars = Math.floor((this.canvas.width * this.canvas.height) / 4000);
    this.stars = [];

    for (let i = 0; i < numStars; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.3,
        speed: Math.random() * 0.02 + 0.01,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const star of this.stars) {
      // Update twinkle
      star.twinklePhase += star.twinkleSpeed;
      const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7;

      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * twinkle})`;
      this.ctx.fill();
    }
  }

  start(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.canvas.style.display = 'block';
    const animate = () => {
      if (!this.isActive) return;
      this.draw();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  stop(): void {
    this.isActive = false;
    this.canvas.style.display = 'none';
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// DOM Elements
const canvas = document.getElementById('stars-canvas') as HTMLCanvasElement;
const loginSection = document.getElementById('spotify-login') as HTMLDivElement;
const nowPlayingSection = document.getElementById('spotify-now-playing') as HTMLDivElement;
const idleSection = document.getElementById('spotify-idle') as HTMLDivElement;
const connectButton = document.getElementById('spotify-connect') as HTMLButtonElement;
const disconnectButton = document.getElementById('spotify-disconnect') as HTMLButtonElement;
const errorDisplay = document.getElementById('spotify-error') as HTMLParagraphElement;
const albumArtContainer = document.getElementById('album-art') as HTMLDivElement;
const trackTitle = document.getElementById('track-title') as HTMLDivElement;
const trackArtist = document.getElementById('track-artist') as HTMLDivElement;
const progressFill = document.getElementById('progress-fill') as HTMLDivElement;
const currentTimeEl = document.getElementById('current-time') as HTMLSpanElement;
const totalTimeEl = document.getElementById('total-time') as HTMLSpanElement;
const prevButton = document.getElementById('prev-btn') as HTMLButtonElement;
const nextButton = document.getElementById('next-btn') as HTMLButtonElement;
const themeButtons = document.querySelectorAll('.theme-btn') as NodeListOf<HTMLButtonElement>;
const queueList = document.getElementById('queue-list') as HTMLDivElement;
const playlistsList = document.getElementById('playlists-list') as HTMLDivElement;
const queueSection = document.getElementById('spotify-queue') as HTMLDivElement;
const playlistsSection = document.getElementById('spotify-playlists') as HTMLDivElement;
const playlistToggleBtn = document.getElementById('playlist-toggle-btn') as HTMLButtonElement;
const disconnectSection = document.getElementById('settings-disconnect-section') as HTMLDivElement;

// Settings menu elements
const settingsTrigger = document.getElementById('settings-trigger') as HTMLButtonElement;
const settingsPanel = document.getElementById('settings-panel') as HTMLDivElement;

// Widget elements
const clockTimeEl = document.getElementById('clock-time') as HTMLDivElement;
const clockDateEl = document.getElementById('clock-date') as HTMLDivElement;
const clockDotsEl = document.getElementById('clock-dots') as HTMLDivElement;
const calendarEl = document.getElementById('widget-calendar') as HTMLDivElement;
const weatherTempEl = document.getElementById('weather-temp') as HTMLDivElement;
const weatherDescEl = document.getElementById('weather-desc') as HTMLDivElement;
const weatherIconEl = document.getElementById('weather-icon') as SVGElement;
const bibleVerseEl = document.getElementById('bible-verse') as HTMLDivElement;
const bibleRefEl = document.getElementById('bible-ref') as HTMLDivElement;

// Calendar configuration
const CALENDAR_START_HOUR = 5;  // 5 AM
const CALENDAR_END_HOUR = 24;   // Midnight
const CALENDAR_HOUR_HEIGHT = 40; // pixels per hour

// Calendar settings elements
const calendarAppleIdInput = document.getElementById('calendar-appleid-input') as HTMLInputElement;
const calendarPasswordInput = document.getElementById('calendar-password-input') as HTMLInputElement;
const calendarSaveBtn = document.getElementById('calendar-save-btn') as HTMLButtonElement;
const calendarLoginSection = document.getElementById('calendar-login') as HTMLDivElement;
const calendarConnectedSection = document.getElementById('calendar-connected') as HTMLDivElement;
const calendarConnectedText = document.getElementById('calendar-connected-text') as HTMLSpanElement;
const calendarDisconnectBtn = document.getElementById('calendar-disconnect-btn') as HTMLButtonElement;

// Christmas Bible verses
const CHRISTMAS_VERSES = [
  { verse: '"For unto us a child is born, unto us a son is given."', ref: 'Isaiah 9:6' },
  { verse: '"And she shall bring forth a son, and thou shalt call his name Jesus."', ref: 'Matthew 1:21' },
  { verse: '"Glory to God in the highest, and on earth peace, good will toward men."', ref: 'Luke 2:14' },
  { verse: '"For God so loved the world, that he gave his only begotten Son."', ref: 'John 3:16' },
  { verse: '"Behold, a virgin shall conceive, and bear a son, and shall call his name Immanuel."', ref: 'Isaiah 7:14' },
  { verse: '"The people that walked in darkness have seen a great light."', ref: 'Isaiah 9:2' },
  { verse: '"And the Word was made flesh, and dwelt among us."', ref: 'John 1:14' },
  { verse: '"Fear not: for, behold, I bring you good tidings of great joy."', ref: 'Luke 2:10' },
];

let currentVerseIndex = 0;

// State for playlist toggle functionality
let selectedPlaylistId: string | null = null;
let currentTrackUri: string | null = null;
let isCurrentTrackInPlaylist: boolean = false;

// Initialize stars background
const starsBackground = new StarsBackground(canvas);

/**
 * Set the current theme
 */
function setTheme(theme: Theme): void {
  // Update body data attribute and class
  document.body.dataset.theme = theme;

  // Remove all theme classes and add the new one
  document.body.classList.remove('theme-stars', 'theme-emmanuel', 'theme-twilight', 'theme-faithful', 'theme-joy', 'theme-silent');
  document.body.classList.add(`theme-${theme}`);

  // Update active button
  themeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });

  // Start/stop stars animation based on theme
  if (theme === 'stars' || theme === 'joy') {
    starsBackground.start();
  } else {
    starsBackground.stop();
  }

  // Save preference
  localStorage.setItem(THEME_KEY, theme);
}

/**
 * Load saved theme or default to stars
 */
function loadTheme(): void {
  const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
  const theme = savedTheme && THEMES.includes(savedTheme) ? savedTheme : 'stars';
  setTheme(theme);
}

/**
 * Format milliseconds to MM:SS
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Show a specific section and hide others (for bottom-right Spotify widget)
 */
function showSection(section: 'login' | 'now-playing' | 'idle'): void {
  // Now playing and idle are in the bottom-right widget area
  nowPlayingSection.style.display = section === 'now-playing' ? 'flex' : 'none';
  idleSection.style.display = section === 'idle' ? 'flex' : 'none';

  // Login is in the settings panel - show/hide the whole section
  // and update visibility of authenticated-only sections
  const isAuthenticated = section !== 'login';
  queueSection.style.display = isAuthenticated ? 'block' : 'none';
  playlistsSection.classList.toggle('settings-menu__section--hidden', !isAuthenticated);
  disconnectSection.classList.toggle('settings-menu__section--hidden', !isAuthenticated);
  loginSection.style.display = isAuthenticated ? 'none' : 'block';
}

/**
 * Update the UI based on Spotify state
 */
function updateUI(state: SpotifyState): void {
  // Show error if present
  if (state.error) {
    errorDisplay.textContent = state.error;
  } else {
    errorDisplay.textContent = '';
  }

  // Handle authentication state
  if (!state.isAuthenticated) {
    showSection('login');
    return;
  }

  // Check if we have a track
  if (state.track) {
    showSection('now-playing');

    // Extract track URI and update toggle button if track changed
    const trackUri = state.track.uri;
    if (trackUri !== currentTrackUri) {
      currentTrackUri = trackUri;
      updatePlaylistToggle();
    }

    // Update track info
    trackTitle.textContent = state.track.name;
    trackArtist.textContent = state.track.artists.join(', ');

    // Update album art
    if (state.track.albumArt) {
      const existingImg = albumArtContainer.querySelector('img');
      if (existingImg) {
        existingImg.src = state.track.albumArt;
      } else {
        // Remove placeholder and add image
        albumArtContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src = state.track.albumArt;
        img.alt = `${state.track.album} album art`;
        albumArtContainer.appendChild(img);
      }
    }

    // Update progress
    const progress = (state.track.progress / state.track.duration) * 100;
    progressFill.style.width = `${progress}%`;
    currentTimeEl.textContent = formatTime(state.track.progress);
    totalTimeEl.textContent = formatTime(state.track.duration);
  } else {
    showSection('idle');
    if (currentTrackUri !== null) {
      currentTrackUri = null;
      updatePlaylistToggle();
    }
  }
}

/**
 * Handle logout
 */
function handleLogout(): void {
  spotifyClient.logout();
  // Reset album art to placeholder
  albumArtContainer.innerHTML = `
    <div class="widget-now-playing__placeholder">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>
    </div>
  `;
  // Hide authenticated sections in settings
  queueSection.style.display = 'none';
  playlistsSection.classList.add('settings-menu__section--hidden');
  disconnectSection.classList.add('settings-menu__section--hidden');
  loginSection.style.display = 'block';
}

/**
 * Render queue items
 */
function renderQueue(queue: SpotifyQueueTrack[]): void {
  if (queue.length === 0) {
    queueList.innerHTML = '<div class="widget-empty">Queue is empty</div>';
    return;
  }

  queueList.innerHTML = queue.map(track => `
    <div class="widget-queue-item">
      <div class="widget-queue-item__art">
        ${track.albumArt
      ? `<img src="${track.albumArt}" alt="">`
      : '<div style="width:100%;height:100%;background:rgba(255,255,255,0.1)"></div>'}
      </div>
      <div class="widget-queue-item__info">
        <div class="widget-queue-item__title">${escapeHtml(track.name)}</div>
        <div class="widget-queue-item__artist">${escapeHtml(track.artists.join(', '))}</div>
      </div>
    </div>
  `).join('');
}

/**
 * Render playlists
 */
function renderPlaylists(playlists: SpotifyPlaylist[]): void {
  if (playlists.length === 0) {
    playlistsList.innerHTML = '<div class="widget-empty">No playlists found</div>';
    return;
  }

  // Sort playlists: owned/collaborative first, then followed
  const sortedPlaylists = [...playlists].sort((a, b) => {
    const aCanModify = a.isOwned || a.isCollaborative;
    const bCanModify = b.isOwned || b.isCollaborative;
    if (aCanModify && !bCanModify) return -1;
    if (!aCanModify && bCanModify) return 1;
    return 0;
  });

  playlistsList.innerHTML = sortedPlaylists.map(playlist => {
    const playlistId = playlist.uri.split(':').pop() || '';
    const isSelected = selectedPlaylistId === playlistId;
    const canModify = playlist.isOwned || playlist.isCollaborative;
    return `
    <div class="widget-playlist-item${isSelected ? ' selected' : ''}${!canModify ? ' readonly' : ''}" data-uri="${playlist.uri}" data-id="${playlistId}" data-can-modify="${canModify}">
      <div class="widget-playlist-item__art">
        ${playlist.imageUrl
        ? `<img src="${playlist.imageUrl}" alt="">`
        : '<div style="width:100%;height:100%;background:rgba(255,255,255,0.1)"></div>'}
      </div>
      <div class="widget-playlist-item__info">
        <div class="widget-playlist-item__name">${escapeHtml(playlist.name)}${!canModify ? ' <span class="readonly-badge">followed</span>' : ''}</div>
        <div class="widget-playlist-item__tracks">${playlist.trackCount} tracks</div>
      </div>
      <div class="widget-playlist-item__actions">
        ${canModify ? `
        <button class="widget-playlist-item__select" title="Select for add/remove">
          <svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
        </button>
        ` : ''}
        <button class="widget-playlist-item__play" title="Play playlist">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
    </div>
    `;
  }).join('');

  // Add click handlers for playlists
  playlistsList.querySelectorAll('.widget-playlist-item').forEach(item => {
    // Play button
    const playBtn = item.querySelector('.widget-playlist-item__play');
    playBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const uri = item.getAttribute('data-uri');
      if (uri) {
        spotifyClient.playPlaylist(uri);
      }
    });

    // Select button (only exists for modifiable playlists)
    const selectBtn = item.querySelector('.widget-playlist-item__select');
    selectBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const playlistId = item.getAttribute('data-id');
      selectPlaylist(playlistId);
    });

    // Clicking the whole item selects it (only if modifiable)
    item.addEventListener('click', () => {
      const canModify = item.getAttribute('data-can-modify') === 'true';
      if (canModify) {
        const playlistId = item.getAttribute('data-id');
        selectPlaylist(playlistId);
      }
    });
  });
}

/**
 * Select a playlist for add/remove functionality
 */
function selectPlaylist(playlistId: string | null): void {
  if (selectedPlaylistId === playlistId) {
    // Deselect if clicking same playlist
    selectedPlaylistId = null;
  } else {
    selectedPlaylistId = playlistId;
  }

  // Update UI to show selected playlist
  playlistsList.querySelectorAll('.widget-playlist-item').forEach(item => {
    const itemId = item.getAttribute('data-id');
    item.classList.toggle('selected', itemId === selectedPlaylistId);
  });

  // Update the toggle button state
  updatePlaylistToggle();
}

/**
 * Update the playlist toggle button based on current track and selected playlist
 */
async function updatePlaylistToggle(): Promise<void> {
  if (!selectedPlaylistId || !currentTrackUri) {
    playlistToggleBtn.classList.remove('in-playlist', 'no-playlist');
    playlistToggleBtn.style.opacity = '0.3';
    playlistToggleBtn.title = 'Select a playlist first';
    return;
  }

  playlistToggleBtn.style.opacity = '1';

  try {
    isCurrentTrackInPlaylist = await spotifyClient.isTrackInPlaylist(selectedPlaylistId, currentTrackUri);

    if (isCurrentTrackInPlaylist) {
      playlistToggleBtn.classList.add('in-playlist');
      playlistToggleBtn.classList.remove('no-playlist');
      playlistToggleBtn.title = 'Remove from playlist';
    } else {
      playlistToggleBtn.classList.add('no-playlist');
      playlistToggleBtn.classList.remove('in-playlist');
      playlistToggleBtn.title = 'Add to playlist';
    }
  } catch (error) {
    console.error('Error checking track in playlist:', error);
    playlistToggleBtn.style.opacity = '0.3';
  }
}

/**
 * Handle clicking the playlist toggle button
 */
async function handlePlaylistToggle(): Promise<void> {
  if (!selectedPlaylistId || !currentTrackUri) {
    console.log('Cannot toggle: no playlist selected or no track playing');
    return;
  }

  // Show loading state
  playlistToggleBtn.style.opacity = '0.5';

  try {
    let success: boolean;
    if (isCurrentTrackInPlaylist) {
      console.log('Removing track from playlist:', selectedPlaylistId, currentTrackUri);
      success = await spotifyClient.removeTrackFromPlaylist(selectedPlaylistId, currentTrackUri);
    } else {
      console.log('Adding track to playlist:', selectedPlaylistId, currentTrackUri);
      success = await spotifyClient.addTrackToPlaylist(selectedPlaylistId, currentTrackUri);
    }

    console.log('Playlist update result:', success);

    // Update the button state
    await updatePlaylistToggle();
  } catch (error) {
    console.error('Error updating playlist:', error);
    playlistToggleBtn.style.opacity = '1';
  }
}

/**
 * Calculate position for a dot along the square perimeter
 * Starting from top-center (12 o'clock), going clockwise,
 * with 20px rounded corners.
 */
function getSquarePerimeterPosition(
  index: number,
  totalDots: number,
  size: number,
  margin: number,
  dotSize: number
): { x: number; y: number } {
  const innerSize = size - margin * 2;
  const cornerRadius = Math.min(20, innerSize / 2);
  const straightLength = Math.max(0, innerSize - cornerRadius * 2);
  const quarterArcLength = (Math.PI * cornerRadius) / 2;
  const perimeter = straightLength * 4 + quarterArcLength * 4;

  // Start at top-center: shift from top-left tangent point by half of top straight segment.
  const startOffset = straightLength / 2;
  const distance = ((index / totalDots) * perimeter + startOffset) % perimeter;

  const halfDot = dotSize / 2;
  let d = distance;
  let x = 0;
  let y = 0;

  // Top straight: left -> right
  if (d <= straightLength) {
    x = margin + cornerRadius + d;
    y = margin;
  } else {
    d -= straightLength;

    // Top-right arc: -90deg -> 0deg
    if (d <= quarterArcLength) {
      const t = d / quarterArcLength;
      const angle = (-Math.PI / 2) + (Math.PI / 2) * t;
      const cx = size - margin - cornerRadius;
      const cy = margin + cornerRadius;
      x = cx + Math.cos(angle) * cornerRadius;
      y = cy + Math.sin(angle) * cornerRadius;
    } else {
      d -= quarterArcLength;

      // Right straight: top -> bottom
      if (d <= straightLength) {
        x = size - margin;
        y = margin + cornerRadius + d;
      } else {
        d -= straightLength;

        // Bottom-right arc: 0deg -> 90deg
        if (d <= quarterArcLength) {
          const t = d / quarterArcLength;
          const angle = (Math.PI / 2) * t;
          const cx = size - margin - cornerRadius;
          const cy = size - margin - cornerRadius;
          x = cx + Math.cos(angle) * cornerRadius;
          y = cy + Math.sin(angle) * cornerRadius;
        } else {
          d -= quarterArcLength;

          // Bottom straight: right -> left
          if (d <= straightLength) {
            x = size - margin - cornerRadius - d;
            y = size - margin;
          } else {
            d -= straightLength;

            // Bottom-left arc: 90deg -> 180deg
            if (d <= quarterArcLength) {
              const t = d / quarterArcLength;
              const angle = (Math.PI / 2) + (Math.PI / 2) * t;
              const cx = margin + cornerRadius;
              const cy = size - margin - cornerRadius;
              x = cx + Math.cos(angle) * cornerRadius;
              y = cy + Math.sin(angle) * cornerRadius;
            } else {
              d -= quarterArcLength;

              // Left straight: bottom -> top
              if (d <= straightLength) {
                x = margin;
                y = size - margin - cornerRadius - d;
              } else {
                d -= straightLength;

                // Top-left arc: 180deg -> 270deg
                const t = Math.min(1, d / quarterArcLength);
                const angle = Math.PI + (Math.PI / 2) * t;
                const cx = margin + cornerRadius;
                const cy = margin + cornerRadius;
                x = cx + Math.cos(angle) * cornerRadius;
                y = cy + Math.sin(angle) * cornerRadius;
              }
            }
          }
        }
      }
    }
  }

  return { x: x - halfDot, y: y - halfDot };
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Fetch and update queue
 */
async function updateQueue(): Promise<void> {
  const queue = await spotifyClient.getQueue();
  renderQueue(queue);
}

/**
 * Fetch and update playlists (only once)
 */
async function loadPlaylists(): Promise<void> {
  const playlists = await spotifyClient.getPlaylists();
  renderPlaylists(playlists);
}

// ============================================
// Widget Functions
// ============================================

/**
 * Update clock widget
 */
function updateClock(): void {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const displayHours = hours % 12 || 12;

  clockTimeEl.textContent = `${displayHours}:${minutes.toString().padStart(2, '0')}`;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  clockDateEl.textContent = days[now.getDay()];

  // Update clock dots - all dots up to current second are active
  const dots = clockDotsEl.querySelectorAll('.widget-clock__dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('widget-clock__dot--active', i <= seconds);
  });
}

/**
 * Update calendar widget - 3-day timeline view
 */
function updateCalendar(): void {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  // Update the 3 day columns
  for (let i = 0; i < 3; i++) {
    const dayCol = document.getElementById(`calendar-day-${i}`);
    if (!dayCol) continue;

    const date = new Date();
    date.setDate(date.getDate() + i);

    const headerEl = dayCol.querySelector('.widget-calendar__day-header');
    if (headerEl) {
      const weekdayEl = headerEl.querySelector('.widget-calendar__weekday');
      const dayNumEl = headerEl.querySelector('.widget-calendar__day-num');
      if (weekdayEl) weekdayEl.textContent = days[date.getDay()];
      if (dayNumEl) dayNumEl.textContent = date.getDate().toString();
    }

    // Create timeline inner with hour lines
    const timelineEl = dayCol.querySelector('.widget-calendar__timeline');
    if (timelineEl && !timelineEl.querySelector('.widget-calendar__timeline-inner')) {
      const inner = document.createElement('div');
      inner.className = 'widget-calendar__timeline-inner';

      // Add hour lines
      for (let h = CALENDAR_START_HOUR; h < CALENDAR_END_HOUR; h++) {
        const line = document.createElement('div');
        line.className = 'widget-calendar__hour-line';
        line.style.top = `${(h - CALENDAR_START_HOUR) * CALENDAR_HOUR_HEIGHT}px`;
        inner.appendChild(line);

        // Add hour label only to first column
        if (i === 0) {
          const label = document.createElement('div');
          label.className = 'widget-calendar__hour-label';
          label.style.top = `${(h - CALENDAR_START_HOUR) * CALENDAR_HOUR_HEIGHT}px`;
          const displayHour = h % 12 || 12;
          const ampm = h < 12 ? 'AM' : 'PM';
          label.textContent = `${displayHour}${ampm === 'AM' ? 'a' : 'p'}`;
          inner.appendChild(label);
        }
      }

      timelineEl.appendChild(inner);
    }
  }

  // Scroll to current time on first load
  scrollCalendarToNow();

  // Load events from iCloud calendar
  loadCalendarEvents();
}

/**
 * Scroll calendar timelines to show current time
 */
function scrollCalendarToNow(): void {
  const now = new Date();
  const currentHour = now.getHours();

  // Only scroll if within visible range
  if (currentHour >= CALENDAR_START_HOUR && currentHour < CALENDAR_END_HOUR) {
    const scrollTo = Math.max(0, (currentHour - CALENDAR_START_HOUR - 2) * CALENDAR_HOUR_HEIGHT);

    for (let i = 0; i < 3; i++) {
      const timelineEl = document.querySelector(`#calendar-day-${i} .widget-calendar__timeline`);
      if (timelineEl) {
        timelineEl.scrollTop = scrollTo;
      }
    }
  }
}

/**
 * Scroll a single day column to show its next relevant event timespan.
 */
function focusDayTimeline(
  dayCol: HTMLElement,
  timedEvents: CalendarEvent[],
  dayDate: Date,
  hasAnyEvents: boolean
): void {
  const timelineEl = dayCol.querySelector('.widget-calendar__timeline') as HTMLElement | null;
  if (!timelineEl) return;

  if (!hasAnyEvents) {
    timelineEl.scrollTop = 0;
    return;
  }

  const now = new Date();
  const isToday = dayDate.toDateString() === now.toDateString();

  // Choose the event to focus on.
  let target = timedEvents[0] || null;
  if (isToday) {
    target = timedEvents.find(event => event.end.getTime() > now.getTime()) || timedEvents[timedEvents.length - 1] || null;
  }

  if (!target) {
    timelineEl.scrollTop = 0;
    return;
  }

  const eventStartHour = target.start.getHours() + target.start.getMinutes() / 60;
  const focusTop = (eventStartHour - CALENDAR_START_HOUR - 1.5) * CALENDAR_HOUR_HEIGHT;
  const maxScroll = timelineEl.scrollHeight - timelineEl.clientHeight;
  timelineEl.scrollTop = Math.max(0, Math.min(maxScroll, focusTop));
}

/**
 * Format time for calendar events
 */
function formatEventTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Load and render calendar events for 3-day view
 */
async function loadCalendarEvents(): Promise<void> {
  if (!calendarClient.isConfigured()) {
    // Show placeholder in each day column
    for (let i = 0; i < 3; i++) {
      const dayCol = document.getElementById(`calendar-day-${i}`) as HTMLElement | null;
      if (!dayCol) continue;
      const allDayEl = dayCol.querySelector('.widget-calendar__all-day');
      const timelineInner = dayCol.querySelector('.widget-calendar__timeline-inner');
      if (allDayEl) {
        allDayEl.innerHTML = `
          <div class="widget-calendar__all-day-event" style="background: rgba(255,255,255,0.1); border-left-color: rgba(255,255,255,0.3);">
            Connect iCloud in settings
          </div>
        `;
      }
      if (timelineInner) {
        timelineInner.querySelectorAll('.widget-calendar__event, .widget-calendar__empty-overlay').forEach(el => el.remove());
      }
    }
    return;
  }

  try {
    const eventsByDay = await calendarClient.getEventsForDays(3);

    let dayIndex = 0;
    eventsByDay.forEach((events, dateKey) => {
      const dayCol = document.getElementById(`calendar-day-${dayIndex}`) as HTMLElement | null;
      if (!dayCol) return;

      const dayDate = new Date(`${dateKey}T00:00:00`);

      const allDayEl = dayCol.querySelector('.widget-calendar__all-day');
      const timelineInner = dayCol.querySelector('.widget-calendar__timeline-inner');

      // Clear existing events
      if (allDayEl) allDayEl.innerHTML = '';
      if (timelineInner) {
        // Remove old events but keep hour lines
        timelineInner.querySelectorAll('.widget-calendar__event').forEach(el => el.remove());
      }

      const allDayEvents = events.filter(e => e.allDay);
      const timedEvents = events.filter(e => !e.allDay);

      // Render all-day events
      if (allDayEl) {
        allDayEvents.slice(0, 3).forEach(event => {
          const eventEl = document.createElement('div');
          eventEl.className = 'widget-calendar__all-day-event';
          if (event.title.toLowerCase().includes('holiday') || event.title.toLowerCase().includes('christmas') || event.title.toLowerCase().includes('good friday')) {
            eventEl.classList.add('widget-calendar__all-day-event--holiday');
          }
          eventEl.textContent = event.title;
          eventEl.style.borderLeftColor = event.color || '#5b8def';
          allDayEl.appendChild(eventEl);
        });

        // Show count if more than 3
        if (allDayEvents.length > 3) {
          const moreEl = document.createElement('div');
          moreEl.className = 'widget-calendar__all-day-event';
          moreEl.textContent = `+${allDayEvents.length - 3} more`;
          moreEl.style.background = 'transparent';
          moreEl.style.color = 'rgba(255,255,255,0.5)';
          allDayEl.appendChild(moreEl);
        }
      }

      // Render timed events
      if (timelineInner) {
        timedEvents.forEach(event => {
          const startHour = event.start.getHours() + event.start.getMinutes() / 60;
          const endHour = event.end.getHours() + event.end.getMinutes() / 60;

          // Skip events outside visible range
          if (endHour < CALENDAR_START_HOUR || startHour >= CALENDAR_END_HOUR) return;

          const clampedStart = Math.max(startHour, CALENDAR_START_HOUR);
          const clampedEnd = Math.min(endHour, CALENDAR_END_HOUR);

          const top = (clampedStart - CALENDAR_START_HOUR) * CALENDAR_HOUR_HEIGHT;
          const height = Math.max(20, (clampedEnd - clampedStart) * CALENDAR_HOUR_HEIGHT);

          const eventEl = document.createElement('div');
          eventEl.className = 'widget-calendar__event';
          eventEl.style.top = `${top}px`;
          eventEl.style.height = `${height}px`;
          eventEl.style.borderLeftColor = event.color || '#5b8def';
          eventEl.style.background = `rgba(91, 141, 239, 0.4)`;

          const titleEl = document.createElement('div');
          titleEl.className = 'widget-calendar__event-title';
          titleEl.textContent = event.title;
          eventEl.appendChild(titleEl);

          if (height > 30) {
            const timeEl = document.createElement('div');
            timeEl.className = 'widget-calendar__event-time';
            timeEl.textContent = formatEventTime(event.start);
            eventEl.appendChild(timeEl);
          }

          timelineInner.appendChild(eventEl);
        });

        const hasAnyEvents = allDayEvents.length > 0 || timedEvents.length > 0;
        if (!hasAnyEvents) {
          const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
          const emptyEl = document.createElement('div');
          emptyEl.className = 'widget-calendar__empty-overlay';
          emptyEl.textContent = isWeekend ? 'Free!' : 'Work...';
          timelineInner.appendChild(emptyEl);
        }
      }

      // Focus each day independently on the next event timespan.
      focusDayTimeline(dayCol, timedEvents, dayDate, allDayEvents.length > 0 || timedEvents.length > 0);

      dayIndex++;
    });

    // Update now line position (only visible on first day)
    updateNowLine();
  } catch (error) {
    console.error('Failed to load calendar events:', error);
  }
}

/**
 * Update the current time indicator line
 */
function updateNowLine(): void {
  const nowLine = document.getElementById('calendar-now-line');
  if (!nowLine) return;

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Only show if within visible range and it's today
  if (currentHour >= CALENDAR_START_HOUR && currentHour < CALENDAR_END_HOUR) {
    const firstDayTimeline = document.querySelector('#calendar-day-0 .widget-calendar__timeline');
    if (firstDayTimeline) {
      const scrollTop = firstDayTimeline.scrollTop;
      const headerHeight = 60; // approximate header + all-day section height
      const top = (currentHour - CALENDAR_START_HOUR) * CALENDAR_HOUR_HEIGHT + headerHeight - scrollTop;

      // Only show if in viewport
      if (top > headerHeight && top < calendarEl.offsetHeight) {
        nowLine.style.display = 'block';
        nowLine.style.top = `${top}px`;
        nowLine.style.width = `${calendarEl.offsetWidth / 3}px`;
      } else {
        nowLine.style.display = 'none';
      }
    }
  } else {
    nowLine.style.display = 'none';
  }
}

/**
 * Update calendar settings UI
 */
function updateCalendarSettingsUI(): void {
  const isConfigured = calendarClient.isConfigured();
  calendarLoginSection.style.display = isConfigured ? 'none' : 'flex';
  calendarConnectedSection.style.display = isConfigured ? 'flex' : 'none';

  if (isConfigured) {
    const appleId = calendarClient.getAppleId();
    calendarConnectedText.textContent = appleId || 'Connected';
  }
}

/**
 * Rotate bible verses
 */
function rotateBibleVerse(): void {
  currentVerseIndex = (currentVerseIndex + 1) % CHRISTMAS_VERSES.length;
  const verse = CHRISTMAS_VERSES[currentVerseIndex];

  // Fade out
  bibleVerseEl.style.opacity = '0';
  bibleRefEl.style.opacity = '0';

  setTimeout(() => {
    bibleVerseEl.textContent = verse.verse;
    bibleRefEl.textContent = verse.ref;
    // Fade in
    bibleVerseEl.style.opacity = '1';
    bibleRefEl.style.opacity = '1';
  }, 300);
}

/**
 * Weather icon SVG paths
 */
const WEATHER_ICONS: { [key: string]: string } = {
  'clear': 'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z',
  'clouds': 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
  'rain': 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h.71C7.37 7.69 9.48 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3s-1.34 3-3 3z',
  'snow': 'M22 11h-4.17l3.24-3.24-1.41-1.42L15 11h-2V9l4.66-4.66-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93 6.34 4.34 11 9v2H9L4.34 6.34 2.93 7.76 6.17 11H2v2h4.17l-3.24 3.24 1.41 1.42L9 13h2v2l-4.66 4.66 1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24 1.42-1.41L13 15v-2h2l4.66 4.66 1.41-1.42L17.83 13H22z',
};

/**
 * Fetch weather data (using Open-Meteo free API)
 */
async function fetchWeather(): Promise<void> {
  try {
    // Get user's location (default to a nice Christmas location if denied)
    let lat = 64.1466; // Rovaniemi, Finland (Santa's home!)
    let lon = -21.9426;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      lat = position.coords.latitude;
      lon = position.coords.longitude;
    } catch {
      // Use default location
    }

    // Fetch weather from Open-Meteo (free, no API key needed)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`
    );

    if (!response.ok) throw new Error('Weather fetch failed');

    const data = await response.json();
    const temp = Math.round(data.current.temperature_2m);
    const weatherCode = data.current.weather_code;

    // Map weather codes to descriptions and icons
    let description = 'Clear';
    let iconType = 'clear';

    if (weatherCode >= 0 && weatherCode <= 3) {
      description = weatherCode === 0 ? 'Clear' : 'Partly Cloudy';
      iconType = weatherCode === 0 ? 'clear' : 'clouds';
    } else if (weatherCode >= 45 && weatherCode <= 48) {
      description = 'Foggy';
      iconType = 'clouds';
    } else if (weatherCode >= 51 && weatherCode <= 67) {
      description = 'Rainy';
      iconType = 'rain';
    } else if (weatherCode >= 71 && weatherCode <= 77) {
      description = 'Snowy';
      iconType = 'snow';
    } else if (weatherCode >= 80 && weatherCode <= 99) {
      description = weatherCode >= 95 ? 'Thunderstorm' : 'Showers';
      iconType = 'rain';
    }

    weatherTempEl.textContent = `${temp}°F`;
    weatherDescEl.textContent = description;

    // Update icon
    const iconPath = WEATHER_ICONS[iconType] || WEATHER_ICONS['clear'];
    weatherIconEl.innerHTML = `<path d="${iconPath}"/>`;

    // Update icon color based on weather
    if (iconType === 'clear') {
      weatherIconEl.style.color = '#ffd93d';
    } else if (iconType === 'snow') {
      weatherIconEl.style.color = '#a8d8ff';
    } else {
      weatherIconEl.style.color = 'rgba(255, 255, 255, 0.6)';
    }

  } catch (error) {
    console.error('Weather fetch error:', error);
    weatherTempEl.textContent = '--°';
    weatherDescEl.textContent = 'Unavailable';
  }
}

/**
 * Initialize all widgets
 */
function initWidgets(): void {
  // Create clock dots (60 for seconds) positioned along square perimeter
  // Starting from top-center (12 o'clock), going clockwise
  const size = 200;
  const margin = 8; // Distance from edge
  const dotSize = 5;
  const hourDotSize = 7;

  for (let i = 0; i < 60; i++) {
    const dot = document.createElement('div');
    const isHour = i % 5 === 0;
    dot.className = 'widget-clock__dot' + (isHour ? ' widget-clock__dot--hour' : '');

    // Calculate position along square perimeter
    // 60 dots, 15 per side, starting from top-center
    const pos = getSquarePerimeterPosition(i, 60, size, margin, isHour ? hourDotSize : dotSize);
    dot.style.left = `${pos.x}px`;
    dot.style.top = `${pos.y}px`;

    clockDotsEl.appendChild(dot);
  }

  // Initial updates
  updateClock();
  updateCalendar();
  fetchWeather();

  // Set initial bible verse with transition styles
  bibleVerseEl.style.transition = 'opacity 0.3s ease';
  bibleRefEl.style.transition = 'opacity 0.3s ease';
  const initialVerse = CHRISTMAS_VERSES[0];
  bibleVerseEl.textContent = initialVerse.verse;
  bibleRefEl.textContent = initialVerse.ref;

  // Update clock every second
  setInterval(updateClock, 1000);

  // Update now line every minute
  setInterval(updateNowLine, 60000);

  // Update calendar every minute (in case day changes)
  setInterval(updateCalendar, 60000);

  // Rotate bible verses every 30 seconds
  setInterval(rotateBibleVerse, 30000);

  // Refresh weather every 10 minutes
  setInterval(fetchWeather, 600000);
}

/**
 * Initialize the room
 */
async function init(): Promise<void> {
  // Load saved theme
  loadTheme();

  // Initialize widgets (clock, calendar, weather, bible verse)
  initWidgets();

  // Handle OAuth callback if present
  await spotifyClient.handleCallback();

  // Subscribe to state changes
  spotifyClient.subscribe(updateUI);

  // Set up settings menu toggle
  settingsTrigger.addEventListener('click', () => {
    settingsPanel.classList.toggle('open');
  });

  // Close settings when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as Node;
    if (!settingsPanel.contains(target) && !settingsTrigger.contains(target)) {
      settingsPanel.classList.remove('open');
    }
  });

  // Set up event listeners
  connectButton.addEventListener('click', () => {
    spotifyClient.authorize();
  });

  disconnectButton.addEventListener('click', handleLogout);

  // Playback controls
  prevButton.addEventListener('click', () => {
    spotifyClient.previousTrack();
  });

  nextButton.addEventListener('click', () => {
    spotifyClient.nextTrack();
  });

  // Playlist toggle button
  playlistToggleBtn.addEventListener('click', handlePlaylistToggle);

  // Theme buttons
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme as Theme;
      if (theme) setTheme(theme);
    });
  });

  // Calendar settings
  updateCalendarSettingsUI();

  calendarSaveBtn.addEventListener('click', async () => {
    const appleId = calendarAppleIdInput.value.trim();
    const password = calendarPasswordInput.value.trim();

    if (!appleId || !password) {
      return;
    }

    calendarSaveBtn.textContent = 'Connecting...';
    calendarSaveBtn.disabled = true;

    calendarClient.setCredentials(appleId, password);
    const success = await calendarClient.testConnection();

    if (success) {
      updateCalendarSettingsUI();
      loadCalendarEvents();
      calendarAppleIdInput.value = '';
      calendarPasswordInput.value = '';
    } else {
      calendarClient.clearCredentials();
      alert('Failed to connect. Check your Apple ID and app-specific password.');
    }

    calendarSaveBtn.textContent = 'Connect';
    calendarSaveBtn.disabled = false;
  });

  calendarDisconnectBtn.addEventListener('click', () => {
    calendarClient.clearCredentials();
    updateCalendarSettingsUI();
    loadCalendarEvents();
  });

  // Start polling if authenticated
  if (spotifyClient.isAuthenticated()) {
    spotifyClient.startPolling(2000); // Poll every 2 seconds

    // Show authenticated sections in settings menu
    queueSection.classList.remove('settings-menu__section--hidden');
    playlistsSection.classList.remove('settings-menu__section--hidden');
    disconnectSection.classList.remove('settings-menu__section--hidden');
    loginSection.style.display = 'none';

    // Load playlists once
    loadPlaylists();

    // Update queue immediately and then periodically
    updateQueue();
    setInterval(updateQueue, 5000); // Update queue every 5 seconds
  }
}

// Initialize when DOM is ready
init();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  spotifyClient.stopPolling();
  starsBackground.stop();
});
