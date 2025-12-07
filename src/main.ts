import './styles/main.scss';
import { LyricsManager } from './lyrics/LyricsManager';
import { SyncManager } from './sync/SyncManager';

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
        console.log('[Sync] Received command:', command.command);
        handleSyncCommand(command.command, audioEl);
      });

      console.log('[Sync] Connected with code:', syncCode);
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
      break;
    case 'stop':
      audio.pause();
      audio.currentTime = 0;
      break;
    case 'reset':
      audio.currentTime = 0;
      audio.pause();
      document.body.classList.remove('activated');
      lyricsBox.classList.remove('show');
      pendingPlay = false;
      break;
    case 'activate':
      document.body.classList.add('activated');
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

// Dynamically load lyrics based on data-song attribute
(async () => {
  const songKey = document.body.getAttribute('data-song') || 'hark-herald-angels';
  try {
    const module = await import(`./lyrics/${songKey}.ts`);
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

