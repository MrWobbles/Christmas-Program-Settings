import './styles/main.scss';
import { LyricsManager } from './lyrics/LyricsManager';
import { SyncManager } from './sync/SyncManager';
import type { TimedLyric } from './lyrics/LyricsManager';

// Query common elements
const canvas = document.querySelector('.canvas') as HTMLCanvasElement | null;
if (!canvas) throw new Error('Canvas element not found');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('2D context unavailable');

const lyricsBox = document.querySelector('.lyrics-box') as HTMLElement | null;
const lyricsText = document.querySelector('.lyrics-box__text') as HTMLElement | null;
const audioEl = document.getElementById('carol-audio') as HTMLAudioElement | null;
const mediaBar = document.querySelector('.media-bar') as HTMLElement | null;
const timeDisplay = document.querySelector('.media-bar__time-display') as HTMLElement | null;

if (!lyricsBox || !lyricsText || !audioEl || !mediaBar || !timeDisplay) {
  throw new Error('Required DOM elements are missing');
}

// Ensure audio starts paused (only sync commands should control playback)
audioEl.pause();

// Initialize lyrics manager
const lyricsManager = new LyricsManager(lyricsBox, lyricsText, audioEl, timeDisplay);

// Initialize sync manager (requires sync code in URL parameter)
let syncManager: SyncManager | null = null;
const initSync = async (): Promise<void> => {
  // Check for sync code in URL parameters
  const params = new URLSearchParams(window.location.search);
  const syncCode = params.get('sync-code');

  if (syncCode) {
    try {
      const roomId = getRoomId();
      syncManager = new SyncManager(syncCode, roomId);
      await syncManager.initRoom();

      // Listen for sync commands
      syncManager.onCommand((command) => {
        console.log('[Sync] Received command:', command.command, 'for room:', roomId);
        handleSyncCommand(command.command, audioEl);
      });

      console.log('[Sync] Connected with code:', syncCode);

      // Setup status reporting to sync system (timestamp-based to minimize Firebase writes)
      const sendStatusUpdate = () => {
        if (!syncManager || !audioEl) return;
        const isPlaying = !audioEl.paused;
        const songId = document.body.getAttribute('data-song') || undefined;
        syncManager.sendStatus({
          isActive: true,
          isPlaying: isPlaying,
          currentTime: audioEl.currentTime,
          isActivated: document.body.classList.contains('activated'),
          playStartTime: isPlaying ? Date.now() : undefined,
          playStartPosition: isPlaying ? audioEl.currentTime : undefined,
          songId: songId
        });
      };

      // Send status only on significant state changes (no heartbeat needed)
      audioEl.addEventListener('play', sendStatusUpdate);
      audioEl.addEventListener('pause', sendStatusUpdate);
      audioEl.addEventListener('seeked', sendStatusUpdate);
      audioEl.addEventListener('ended', sendStatusUpdate);

      // Send initial status on page load - force reset state to ensure control panel syncs
      const songId = document.body.getAttribute('data-song') || undefined;
      syncManager.sendStatus({
        isActive: true,
        isPlaying: false,
        currentTime: 0,
        isActivated: false,
        playStartTime: undefined,
        playStartPosition: undefined,
        songId: songId
      });
      console.log('[Sync] Sent initial reset status');

      // Make sendStatusUpdate available globally for command handler
      (window as any).sendStatusUpdate = sendStatusUpdate;

    } catch (err) {
      console.error('[Sync] Failed to initialize:', err);
    }
  }
};

// Helper to get room ID from body class
function getRoomId(): string {
  const classList = document.body.className;
  if (classList.includes('room-twilight')) return 'room-twilight';
  if (classList.includes('room-emmanuel')) return 'room-emmanuel';
  if (classList.includes('room-faithful')) return 'room-faithful';
  if (classList.includes('room-joy')) return 'room-joy';
  return 'unknown';
}

// Handle sync commands
function handleSyncCommand(
  command: string,
  audio: HTMLAudioElement
): void {
  switch (command) {
    case 'play':
      document.body.classList.add('activated');
      lyricsManager.show();
      audio.play().catch((err) => {
        // If play is blocked by autoplay policy, defer it until user interaction
        if (err.name === 'NotAllowedError') {
          pendingPlay = true;
          console.warn('[Sync] Play blocked by autoplay policy, will retry on user interaction');
        } else {
          console.error('[Sync] Play failed:', err);
        }
      });
      break;
    case 'pause':
      audio.pause();
      // Status update will be triggered by 'pause' event listener
      break;
    case 'stop':
      audio.pause();
      audio.currentTime = 0;
      // Send status update immediately for stop
      if ((window as any).sendStatusUpdate) {
        setTimeout(() => (window as any).sendStatusUpdate(), 50);
      }
      break;
    case 'reset':
      audio.currentTime = 0;
      audio.pause();
      document.body.classList.remove('activated');
      if (lyricsBox) lyricsBox.classList.remove('show');
      pendingPlay = false;
      // Send status update immediately for reset
      if ((window as any).sendStatusUpdate) {
        setTimeout(() => (window as any).sendStatusUpdate(), 50);
      }
      break;
    case 'activate':
      document.body.classList.add('activated');
      // Send status update for activate
      if ((window as any).sendStatusUpdate) {
        setTimeout(() => (window as any).sendStatusUpdate(), 50);
      }
      break;
    default:
      console.log('[Sync] Unknown command:', command);
  }
}

// Track user gesture and pending play
let hasUserGesture = false;
let pendingPlay = false;
document.body.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('.lyrics-box') || target.closest('.media-bar') || target.closest('.room-switcher')) return;

  // First click anywhere on the page counts as user gesture (enables autoplay for sync commands)
  if (!hasUserGesture) {
    hasUserGesture = true;
    console.log('[Main] User gesture registered - sync commands can now play audio');
  }

  if (pendingPlay && audioEl) {
    pendingPlay = false;
    document.body.classList.add('activated');
    lyricsManager.show();
    audioEl.play().catch((err) => console.error('[Sync] Deferred play failed:', err));
  }
});

// Dynamically load lyrics based on data-song attribute (explicit map to avoid bundling helper files)
(async () => {
  const songKey = document.body.getAttribute('data-song') || 'hark-herald-angels';

  const songLoaders: Record<string, () => Promise<{ default: TimedLyric[] }>> = {
    'hark-herald-angels': () => import('./lyrics/hark-herald-angels'),
    'joy-to-the-world': () => import('./lyrics/joy-to-the-world'),
    'o-come-o-come-emmanuel': () => import('./lyrics/o-come-o-come-emmanuel'),
    'o-come-all-ye-faithful': () => import('./lyrics/o-come-all-ye-faithful'),
  };

  const loader = songLoaders[songKey] || songLoaders['hark-herald-angels'];

  try {
    const module = await loader();
    lyricsManager.setLyrics(module.default);
  } catch (err) {
    console.error(`Failed to load lyrics for song: ${songKey}`, err);
  }
})();

// Setup common UI event listeners (stop propagation on UI elements)
lyricsBox.addEventListener('click', (e) => e.stopPropagation());
mediaBar.addEventListener('click', (e) => e.stopPropagation());

// Make lyrics box draggable
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

lyricsBox.addEventListener('mousedown', (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest('.lyrics-box__text')) {
    return; // Don't drag if clicking on lyrics text
  }
  isDragging = true;
  const rect = lyricsBox.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;
  lyricsBox.style.transition = 'none';
});

document.addEventListener('mousemove', (e: MouseEvent) => {
  if (!isDragging) return;
  lyricsBox.style.left = `${e.clientX - dragOffsetX}px`;
  lyricsBox.style.top = `${e.clientY - dragOffsetY}px`;
  lyricsBox.style.transform = 'scale(1.5)';
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    lyricsBox.style.transition = '';
  }
});

// Dynamically load room module based on body class
async function initializeRoom() {
  const roomClass = document.body.className;
  try {
    if (roomClass.includes('room-twilight')) {
      const { initRoom2 } = await import('./room/room-twilight');
      initRoom2(canvas as HTMLCanvasElement, ctx as CanvasRenderingContext2D, lyricsManager);
    } else if (roomClass.includes('room-emmanuel')) {
      const { initRoom1 } = await import('./room/room-emmanuel');
      initRoom1(canvas as HTMLCanvasElement, ctx as CanvasRenderingContext2D, lyricsManager);
    } else if (roomClass.includes('room-faithful')) {
      const { initRoom3 } = await import('./room/room-faithful');
      initRoom3(canvas as HTMLCanvasElement, ctx as CanvasRenderingContext2D, lyricsManager);
    } else if (roomClass.includes('room-joy')) {
      const { initRoom4 } = await import('./room/room-joy');
      initRoom4(canvas as HTMLCanvasElement, ctx as CanvasRenderingContext2D, lyricsManager);
    }
  } catch (err) {
    console.error('Failed to initialize room:', err);
  }
}

// Initialize sync system first (async)
initSync();

// Initialize the room
initializeRoom();

// Script toggle functionality
const scriptToggle = document.querySelector('.script-toggle') as HTMLElement | null;
const scriptContent = document.querySelector('.script-content') as HTMLElement | null;

if (scriptToggle && scriptContent) {
  // Start with script collapsed (hidden)
  scriptContent.style.display = 'none';

  scriptToggle.addEventListener('click', () => {
    const isHidden = scriptContent!.style.display === 'none';
    scriptContent!.style.display = isHidden ? 'block' : 'none';
    // Rotate arrow indicator
    const arrow = scriptToggle.textContent?.charAt(0) === '▼' ? '▶' : '▼';
    const label = scriptToggle.textContent?.substring(2) || 'Script';
    scriptToggle.textContent = arrow + ' ' + label;
  });
}

