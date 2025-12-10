import './styles/control.scss';
import { SyncManager, type RoomState } from './sync/SyncManager';
import { getLyrics } from './lyrics/lyricsMap';
import type { TimedLyric } from './lyrics/LyricsManager';

interface ControlState {
  isConnected: boolean;
  currentCode: string;
  syncManager: SyncManager | null;
  lyricsCache: Record<string, TimedLyric[]>; // Cache loaded lyrics
}

const state: ControlState = {
  isConnected: false,
  currentCode: '',
  syncManager: null,
  lyricsCache: {},
};

const ROOM_NAMES: Record<string, string> = {
  'room-emmanuel': 'Room 1: Emmanuel',
  'room-twilight': 'Room 2: Twilight',
  'room-faithful': 'Room 3: Faithful',
  'room-joy': 'Room 4: Joy',
};

// DOM Elements
const menuToggleBtn = document.getElementById('menuToggleBtn')!;
const menuOverlay = document.getElementById('menuOverlay')!;
const menuPanel = document.getElementById('menuPanel')!;
const codeSetupSection = document.getElementById('codeSetupSection')!;
const playbackSection = document.getElementById('playbackSection')!;
const globalControlsMenu = document.getElementById('globalControlsMenu')!;
const roomLinksMenu = document.getElementById('roomLinksMenu')!;
const disconnectSection = document.getElementById('disconnectSection')!;
const syncCodeInput = document.getElementById('syncCodeInput') as HTMLInputElement;
const connectBtn = document.getElementById('connectBtn')!;
const addCodeBtn = document.getElementById('addCodeBtn')!;
const disconnectBtn = document.getElementById('disconnectBtn')!;
const codesList = document.getElementById('codesList')!;
const codesHint = document.getElementById('codesHint')!;
const roomStatusGrid = document.getElementById('roomStatusGrid')!;
const noRoomsMessage = document.getElementById('noRoomsMessage')!;
const roomControlsContainer = document.getElementById('roomControlsContainer')!;
const globalPlayBtn = document.getElementById('globalPlayBtn')!;
const globalPauseBtn = document.getElementById('globalPauseBtn')!;
const globalStopBtn = document.getElementById('globalStopBtn')!;
const globalResetBtn = document.getElementById('globalResetBtn')!;
const roomLinksList = document.getElementById('roomLinksList')!;
const copyAllLinksBtn = document.getElementById('copyAllLinksBtn')!;

const ROOM_FILES: Record<string, string> = {
  'room-emmanuel': 'room1.html',
  'room-twilight': 'room2.html',
  'room-faithful': 'room3.html',
  'room-joy': 'room4.html',
};

// Load saved codes on page load
function loadSavedCodes(): void {
  try {
    const codesJson = localStorage.getItem('christmas_sync_codes');
    const codes = codesJson ? JSON.parse(codesJson) : [];

    if (codes.length === 0) {
      codesHint.style.display = 'block';
      return;
    }

    codesHint.style.display = 'none';
    codesList.innerHTML = codes
      .map(
        (code: string) => `
      <div class="code-item">
        <span class="code-text">${escapeHtml(code)}</span>
        <button class="btn btn-small btn-outline" data-code="${escapeHtml(code)}" onclick="connectToCode('${escapeHtml(code)}')">Connect</button>
        <button class="btn btn-small btn-outline btn-danger" data-code="${escapeHtml(code)}" onclick="removeCode('${escapeHtml(code)}')">Remove</button>
      </div>
    `
      )
      .join('');
  } catch (err) {
    console.error('Failed to load saved codes:', err);
  }
}

// Connect to a code
function connectToCode(code: string): void {
  syncCodeInput.value = code;
  connect();
}

// Remove a code
function removeCode(code: string): void {
  if (confirm(`Remove code "${code}"?`)) {
    try {
      const codesJson = localStorage.getItem('christmas_sync_codes');
      let codes = codesJson ? JSON.parse(codesJson) : [];
      codes = codes.filter((c: string) => c !== code);
      localStorage.setItem('christmas_sync_codes', JSON.stringify(codes));
      loadSavedCodes();
    } catch (err) {
      console.error('Failed to remove code:', err);
      alert('Failed to remove code');
    }
  }
}

// Connect to sync system
async function connect(): Promise<void> {
  const code = syncCodeInput.value.trim();

  if (!code) {
    alert('Please enter a sync code');
    return;
  }

  try {
    // Create sync manager for control panel
    const syncManager = new SyncManager(code, 'control-panel');
    await syncManager.initControl();

    state.syncManager = syncManager;
    state.isConnected = true;
    state.currentCode = code;

    // Update UI
    updateConnectionUI();
    
    // Fetch all initial room statuses on connect (will be empty if rooms haven't sent status yet)
    // Rooms will send status on page load, so this catches any that are already connected
    syncManager.getAllRoomStatuses().then(statuses => {
      Object.values(statuses).forEach(status => {
        updateRoomStatusFromListener(status);
      });
    });
    
    // Listen for real-time status updates from rooms (push instead of poll)
    // This catches new rooms as they connect and send their initial status
    syncManager.onStatus((status) => {
      updateRoomStatusFromListener(status);
    });

    renderRoomLinks();
  } catch (err) {
    alert(`Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// Disconnect
function disconnect(): void {
  if (state.syncManager) {
    state.syncManager.destroy();
  }

  state.isConnected = false;
  state.currentCode = '';
  state.syncManager = null;

  updateConnectionUI();
  renderRoomLinks();
}

// Update UI based on connection state
function updateConnectionUI(): void {
  if (state.isConnected) {
    codeSetupSection.style.display = 'none';
    playbackSection.style.display = 'block';
    globalControlsMenu.style.display = 'block';
    roomLinksMenu.style.display = 'block';
    disconnectSection.style.display = 'block';
    renderRoomLinks();
  } else {
    codeSetupSection.style.display = 'block';
    playbackSection.style.display = 'none';
    globalControlsMenu.style.display = 'none';
    roomLinksMenu.style.display = 'none';
    disconnectSection.style.display = 'none';
    loadSavedCodes();
    renderRoomLinks();
  }
}

// Render room URLs for sharing
function renderRoomLinks(): void {
  if (!roomLinksList) return;

  if (!state.currentCode) {
    roomLinksList.innerHTML = '<p class="form-hint">Enter and connect with a sync code to generate room URLs.</p>';
    return;
  }

  const origin = window.location.origin.replace(/\/$/, '');
  const items = Object.entries(ROOM_FILES)
    .map(([roomId, fileName]) => {
      const url = `${origin}/${fileName}?sync-code=${encodeURIComponent(state.currentCode)}`;
      return `
        <div class="room-link-item">
          <div class="room-link-meta">
            <strong>${escapeHtml(ROOM_NAMES[roomId] || roomId)}</strong>
            <code class="room-link-url">${escapeHtml(url)}</code>
          </div>
          <button class="btn btn-small btn-outline" data-copy-url="${escapeHtml(url)}">Copy</button>
        </div>
      `;
    })
    .join('');

  roomLinksList.innerHTML = items;
}

// Update room status from real-time Firebase listener (called when rooms push updates)
function updateRoomStatusFromListener(roomStatus: RoomState): void {
  const roomControl = roomControlsContainer.querySelector(`[data-room-id="${roomStatus.roomId}"]`) as HTMLElement;
  
  if (!roomControl) {
    // Room not yet in UI, fetch all statuses to build initial list
    if (state.syncManager) {
      state.syncManager.getAllRoomStatuses().then(statuses => {
        updateRoomStatus(statuses);
      });
    }
    return;
  }

  // Update border color: green = playing, yellow = paused/inactive, red = stopped
  let borderColor = 'yellow'; // default: paused or inactive
  if (roomStatus.isPlaying) {
    borderColor = 'green'; // playing
  } else if (roomStatus.currentTime === 0 && !roomStatus.isPlaying) {
    borderColor = 'red'; // stopped/reset
  }
  const wasExpanded = roomControl.classList.contains('room-control--expanded');
  roomControl.className = `room-control room-control--${borderColor}${wasExpanded ? ' room-control--expanded' : ''}`;
  roomControl.setAttribute('data-lyrics-open', String(wasExpanded));
  
  // Update play indicator (hide when stopped)
  const playIndicator = roomControl.querySelector('.play-indicator') as HTMLElement;
  if (playIndicator) {
    playIndicator.style.display = roomStatus.isPlaying ? 'block' : 'none';
  }
  
  // Update status badge
  const statusBadge = roomControl.querySelector('.status-badge') as HTMLElement;
  if (statusBadge) {
    let badgeClass = 'inactive';
    let badgeText = 'Disconnected';
    if (roomStatus.isActive) {
      if (roomStatus.isPlaying) {
        badgeClass = 'active';
        badgeText = 'Playing';
      } else if (roomStatus.currentTime === 0) {
        badgeClass = 'stopped';
        badgeText = 'Stopped';
      } else {
        badgeClass = 'paused';
        badgeText = 'Paused';
      }
    }
    statusBadge.className = `status-badge status-badge--${badgeClass}`;
    statusBadge.textContent = badgeText;
  }
  
  // Update time display data attributes
  const timeDisplay = roomControl.querySelector('.time-display') as HTMLElement;
  if (timeDisplay) {
    // Only update playback data if we have fresh timing info
    if (roomStatus.playStartTime && roomStatus.playStartTime > 0) {
      timeDisplay.setAttribute('data-playing', String(roomStatus.isPlaying));
      timeDisplay.setAttribute('data-start-time', String(roomStatus.playStartTime));
      timeDisplay.setAttribute('data-start-pos', String(roomStatus.playStartPosition || 0));
    } else {
      timeDisplay.setAttribute('data-playing', String(roomStatus.isPlaying));
    }
  }

  // Persist song/time metadata for toggling (fallback to existing song if status omitted it)
  const effectiveElapsed =
    roomStatus.isPlaying && roomStatus.playStartTime !== undefined && roomStatus.playStartPosition !== undefined
      ? (Date.now() - roomStatus.playStartTime) / 1000 + roomStatus.playStartPosition
      : roomStatus.currentTime;

  const existingSongId = roomControl.getAttribute('data-song-id') || '';
  const nextSongId = roomStatus.songId || existingSongId;
  roomControl.setAttribute('data-song-id', nextSongId);
  roomControl.setAttribute('data-last-time', String(effectiveElapsed || 0));
  roomControl.setAttribute('data-last-playing', String(roomStatus.isPlaying));

  // Choose song for lyrics (persist across heartbeats with no songId)
  const songForLyrics = roomStatus.songId || nextSongId || undefined;

  // Update lyrics toggle button text/state
  const toggleBtn = roomControl.querySelector('.toggle-lyrics-btn') as HTMLButtonElement | null;
  if (toggleBtn) {
    const hasSong = Boolean(songForLyrics);
    toggleBtn.disabled = !hasSong;
    const isOpen = roomControl.getAttribute('data-lyrics-open') === 'true';
    toggleBtn.textContent = hasSong ? (isOpen ? 'Hide Lyrics' : 'Show Lyrics') : 'Show Lyrics';
  }
  
  // Update lyrics display based on play state, using timestamp-based time when available
  let effectiveCurrentTime = roomStatus.currentTime;
  if (
    roomStatus.isPlaying &&
    roomStatus.playStartTime !== undefined &&
    roomStatus.playStartPosition !== undefined
  ) {
    const elapsed = (Date.now() - roomStatus.playStartTime) / 1000;
    effectiveCurrentTime = roomStatus.playStartPosition + elapsed;
  }

  updateRoomLyricsDisplay(
    roomStatus.roomId,
    songForLyrics,
    roomStatus.isPlaying,
    effectiveCurrentTime
  );
}

// Poll for room status updates (only on initial connect to load rooms)
function startStatusPolling(): void {
  if (!state.isConnected || !state.syncManager) return;
  
  // Single fetch to populate the initial room list
  state.syncManager.getAllRoomStatuses().then(statuses => {
    updateRoomStatus(statuses);
  });
}

// Track which rooms have been added (persists across status updates)
const addedRooms = new Set<string>();

// Update room status display (only updates status, not controls structure)
function updateRoomStatus(roomStatuses: Record<string, RoomState>): void {
  const activeRooms = Object.values(roomStatuses);

  // Only add new rooms, never remove them
  const roomOrder = ['room-emmanuel', 'room-twilight', 'room-faithful', 'room-joy'];
  
  // Find new rooms to add
  const newRooms = activeRooms.filter(room => !addedRooms.has(room.roomId));
  
  if (newRooms.length === 0 && addedRooms.size === 0) {
    noRoomsMessage.style.display = 'block';
    return;
  }

  noRoomsMessage.style.display = 'none';
  roomStatusGrid.innerHTML = '';

  // Build list of rooms that should be visible (already added or new)
  const sortedRooms = roomOrder
    .map(roomId => {
      if (addedRooms.has(roomId)) {
        return roomStatuses[roomId] || null;
      }
      const room = activeRooms.find(r => r.roomId === roomId);
      if (room) {
        addedRooms.add(roomId);
      }
      return room || null;
    })
    .filter((room): room is RoomState => room !== null);

  // Preserve existing per-room UI state (lyrics toggle)
  const existingState: Record<string, { open: boolean }> = {};
  roomControlsContainer.querySelectorAll('.room-control').forEach((el) => {
    const roomId = el.getAttribute('data-room-id') || '';
    if (roomId) {
      existingState[roomId] = {
        open: el.classList.contains('room-control--expanded'),
      };
    }
  });

  // Build the HTML only once (on first load or room list change)
  // Rebuild if number of rooms changed (new room added) or container is empty
  const currentRoomCount = roomControlsContainer.children.length;
  if (currentRoomCount === 0 || currentRoomCount !== sortedRooms.length) {
    roomControlsContainer.innerHTML = sortedRooms
      .map(
        (room) => {
          // Determine border color: green = playing, yellow = paused, red = stopped
          let borderColor = 'yellow';
          if (room.isPlaying) {
            borderColor = 'green';
          } else if (room.currentTime === 0 && !room.isPlaying) {
            borderColor = 'red';
          }
          
          // Calculate current time locally if playing (reduces Firebase reads)
          let currentTime = room.currentTime;
          if (room.isPlaying && room.playStartTime && room.playStartPosition !== undefined) {
            const elapsed = (Date.now() - room.playStartTime) / 1000;
            currentTime = room.playStartPosition + elapsed;
          }
          
          const wasOpen = existingState[room.roomId]?.open || false;
          const expandedClass = wasOpen ? ' room-control--expanded' : '';
          const toggleLabel = wasOpen ? 'Hide Lyrics' : 'Show Lyrics';

          return `
    <div class="room-control room-control--${borderColor}${expandedClass}" data-room-id="${room.roomId}" data-song-id="${room.songId || ''}" data-lyrics-open="${wasOpen}">
      <span class="play-indicator" style="display: ${room.isPlaying ? 'block' : 'none'}">▶</span>
      <div class="room-control-header">
        <h4>${escapeHtml(ROOM_NAMES[room.roomId] || room.roomId)}</h4>
        <div class="room-status-inline">
          <span class="status-badge status-badge--${room.isActive ? 'active' : 'inactive'}">
            ${room.isActive ? 'Active' : 'Disconnected'}
          </span>
          <span class="status-info time-display" data-playing="${room.isPlaying}" data-start-time="${room.playStartTime || 0}" data-start-pos="${room.playStartPosition || 0}">Time: ${formatTime(currentTime)}</span>
          ${room.isActivated ? '<span class="status-info">✓ Activated</span>' : ''}
        </div>
        <button class="btn btn-small btn-outline toggle-lyrics-btn" onclick="toggleLyrics('${room.roomId}')">${toggleLabel}</button>
      </div>
      <div class="room-buttons">
        <button class="btn btn-small btn-success" onclick="sendCommand('play', '${room.roomId}')">Play</button>
        <button class="btn btn-small btn-warning" onclick="sendCommand('pause', '${room.roomId}')">Pause</button>
        <button class="btn btn-small btn-danger" onclick="sendCommand('stop', '${room.roomId}')">Stop</button>
        <button class="btn btn-small btn-info" onclick="sendCommand('activate', '${room.roomId}')">Activate</button>
        <button class="btn btn-small btn-outline" onclick="sendCommand('reset', '${room.roomId}')">Reset</button>
      </div>
      <div class="room-lyrics-display">
        <div class="lyrics-content"></div>
      </div>
    </div>
  `;
        }
      )
      .join('');
  } else {
    // Update only the status attributes and border colors without rebuilding
    sortedRooms.forEach((room) => {
      const roomControl = roomControlsContainer.querySelector(`[data-room-id="${room.roomId}"]`) as HTMLElement;
      if (roomControl) {
        // Update border color: green = playing, yellow = paused, red = stopped
        let borderColor = 'yellow';
        if (room.isPlaying) {
          borderColor = 'green';
        } else if (room.currentTime === 0 && !room.isPlaying) {
          borderColor = 'red';
        }
        const wasExpanded = roomControl.classList.contains('room-control--expanded');
        const expandedClass = wasExpanded ? ' room-control--expanded' : '';
        roomControl.className = `room-control room-control--${borderColor}${expandedClass}`;
        roomControl.setAttribute('data-lyrics-open', String(wasExpanded));
        roomControl.setAttribute('data-song-id', room.songId || '');
        
        // Update play indicator visibility
        const playIndicator = roomControl.querySelector('.play-indicator') as HTMLElement;
        if (playIndicator) {
          playIndicator.style.display = room.isPlaying ? 'block' : 'none';
        }
        
        // Update status badge
        const statusBadge = roomControl.querySelector('.status-badge') as HTMLElement;
        if (statusBadge) {
          statusBadge.className = `status-badge status-badge--${room.isActive ? 'active' : 'inactive'}`;
          statusBadge.textContent = room.isActive ? 'Active' : 'Disconnected';
        }
        
        // Update time display data attributes (local timer will use these)
        const timeDisplay = roomControl.querySelector('.time-display') as HTMLElement;
        if (timeDisplay) {
          // Only update playback data if we have fresh timing info, otherwise preserve existing
          if (room.playStartTime && room.playStartTime > 0) {
            timeDisplay.setAttribute('data-playing', String(room.isPlaying));
            timeDisplay.setAttribute('data-start-time', String(room.playStartTime));
            timeDisplay.setAttribute('data-start-pos', String(room.playStartPosition || 0));
          } else {
            // If no fresh timing data but room says it's playing, keep using existing timer data
            timeDisplay.setAttribute('data-playing', String(room.isPlaying));
          }
        }
        
        // Update activated status
        const statusInline = roomControl.querySelector('.room-status-inline');
        if (statusInline) {
          // Remove existing activated spans
          const existingActivated = statusInline.querySelector('.status-info:last-child');
          if (existingActivated && existingActivated.textContent?.includes('✓')) {
            existingActivated.remove();
          }
          
          // Add new one if activated
          if (room.isActivated) {
            const span = document.createElement('span');
            span.className = 'status-info';
            span.textContent = '✓ Activated';
            statusInline.appendChild(span);
          }
        }
        
        // Update toggle button text/state based on song availability
        const toggleBtn = roomControl.querySelector('.toggle-lyrics-btn') as HTMLButtonElement | null;
        if (toggleBtn) {
          const hasSong = Boolean(room.songId);
          toggleBtn.disabled = !hasSong;
          const isOpen = roomControl.getAttribute('data-lyrics-open') === 'true';
          toggleBtn.textContent = hasSong ? (isOpen ? 'Hide Lyrics' : 'Show Lyrics') : 'Show Lyrics';
        }
      }
    });
  }
}

// Send command
function sendCommand(
  command: 'play' | 'pause' | 'seek' | 'activate' | 'stop' | 'reset',
  roomId?: string
): void {
  if (!state.syncManager) return;

  state.syncManager.sendCommand(command, roomId);
  console.log(`Sent command: ${command}${roomId ? ` to ${roomId}` : ' (broadcast)'}`);
}

// Seek to specific time (with timestamp for sync)
function seekToTime(roomId: string, seekTime: number): void {
  if (!state.syncManager) return;

  // Send timestamp so room can account for network delay
  state.syncManager.sendCommand('seek', roomId, { 
    time: seekTime,
    commandTimestamp: Date.now()
  });
  
  console.log(`[Control] Seeking ${roomId} to ${seekTime}s`);
}

// Manually toggle lyrics visibility for a room
function toggleLyrics(roomId: string): void {
  const roomControl = roomControlsContainer.querySelector(`[data-room-id="${roomId}"]`) as HTMLElement;
  if (!roomControl) return;

  const songId = roomControl.getAttribute('data-song-id') || undefined;
  if (!songId) return;

  const currentlyOpen = roomControl.getAttribute('data-lyrics-open') === 'true';
  const nextOpen = !currentlyOpen;
  roomControl.setAttribute('data-lyrics-open', String(nextOpen));

  const lastPlaying = roomControl.getAttribute('data-last-playing') === 'true';
  let lastTime = parseFloat(roomControl.getAttribute('data-last-time') || '0');
  if (!Number.isFinite(lastTime)) {
    const timeDisplay = roomControl.querySelector('.time-display') as HTMLElement | null;
    if (timeDisplay) {
      const isPlaying = timeDisplay.getAttribute('data-playing') === 'true';
      const startTime = Number(timeDisplay.getAttribute('data-start-time'));
      const startPos = Number(timeDisplay.getAttribute('data-start-pos'));
      if (isPlaying && startTime > 0 && startPos >= 0) {
        lastTime = startPos + (Date.now() - startTime) / 1000;
      }
    }
  }

  // Only toggle class here (manual control)
  if (nextOpen) {
    roomControl.classList.add('room-control--expanded');
  } else {
    roomControl.classList.remove('room-control--expanded');
  }

  // Re-render/highlight based on current state
  updateRoomLyricsDisplay(roomId, songId, lastPlaying, lastTime);
}

// Format time
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Update lyrics display for a room when it has a song (manual toggle controls expansion)
async function updateRoomLyricsDisplay(roomId: string, songId: string | undefined, isPlaying: boolean, currentTime: number): Promise<void> {
  const roomControl = roomControlsContainer.querySelector(`[data-room-id="${roomId}"]`) as HTMLElement;
  if (!roomControl) return;

  const lyricsDisplay = roomControl.querySelector('.room-lyrics-display') as HTMLElement;
  const lyricsContent = roomControl.querySelector('.lyrics-content') as HTMLElement;
  if (!lyricsDisplay || !lyricsContent) return;

  const storedSongId = roomControl.getAttribute('data-song-id') || undefined;
  const activeSongId = songId || storedSongId;

  const toggleBtn = roomControl.querySelector('.toggle-lyrics-btn') as HTMLButtonElement | null;
  const isOpen = roomControl.getAttribute('data-lyrics-open') === 'true';

  if (toggleBtn) {
    const hasSong = Boolean(activeSongId);
    toggleBtn.disabled = !hasSong;
    toggleBtn.textContent = hasSong ? (isOpen ? 'Hide Lyrics' : 'Show Lyrics') : 'Show Lyrics';
  }

  if (activeSongId) {
     // Check if this is a different song than what's currently loaded
     const currentSongId = roomControl.getAttribute('data-current-song-id');
     const needsRender = currentSongId !== activeSongId || lyricsContent.children.length === 0;
    
    // Load lyrics if not cached
    if (!state.lyricsCache[activeSongId]) {
      try {
        const lyrics = await getLyrics(activeSongId);
        if (lyrics) {
          state.lyricsCache[activeSongId] = lyrics;
        }
      } catch (err) {
        console.error(`[Control] Failed to load lyrics for ${activeSongId}:`, err);
        return;
      }
    }

    // Render lyrics
    const lyrics = state.lyricsCache[activeSongId];
    if (lyrics && lyrics.length > 0) {
      // Only render if song changed or lyrics not present
      if (needsRender) {
        roomControl.setAttribute('data-current-song-id', activeSongId);
        lyricsContent.innerHTML = lyrics
          .map((lyric, idx) => {
            const start = typeof lyric.start === 'string' ? parseFloat(lyric.start) : lyric.start;
            const text = lyric.text || lyric.line || '';
            return `<div class="lyrics-line" data-start="${start}" data-index="${idx}">${escapeHtml(text)}</div>`;
          })
          .join('');
        
        // Add click handlers to seek to that lyric time
        const lyricLines = lyricsContent.querySelectorAll('.lyrics-line') as NodeListOf<HTMLElement>;
        lyricLines.forEach((line) => {
          line.addEventListener('click', () => {
            const seekTime = parseFloat(line.getAttribute('data-start') || '0');
            seekToTime(roomId, seekTime);
          });
        });
      }
      
      // Only highlight when user toggles open; no auto expand/collapse
      if (isOpen) {
        updateLyricsHighlight(roomId, currentTime);
      }
    }
  } else {
    // If no song info, leave current visibility/state unchanged (no auto hide)
  }
}

// Update which lyric line is highlighted based on current time
function updateLyricsHighlight(roomId: string, currentTime: number): void {
  const roomControl = roomControlsContainer.querySelector(`[data-room-id="${roomId}"]`) as HTMLElement;
  if (!roomControl) return;

  const lines = roomControl.querySelectorAll('.lyrics-line') as NodeListOf<HTMLElement>;
  if (lines.length === 0) return;
  
  let activeIdx = 0;

  // Find the current lyric line
  for (let i = lines.length - 1; i >= 0; i--) {
    const start = parseFloat(lines[i].getAttribute('data-start') || '0');
    if (currentTime >= start) {
      activeIdx = i;
      break;
    }
  }

  // Update highlighting (no scrolling)
  lines.forEach((line, idx) => {
    if (idx === activeIdx) {
      line.classList.add('lyrics-line--current');
    } else {
      line.classList.remove('lyrics-line--current');
    }
  });
}


// Update local time displays independently (no Firebase, runs every 500ms)
function updateLocalTimers(): void {
  const timeDisplays = document.querySelectorAll('.time-display');
  timeDisplays.forEach((display) => {
    const isPlaying = display.getAttribute('data-playing') === 'true';
    const startTime = Number(display.getAttribute('data-start-time'));
    const startPos = Number(display.getAttribute('data-start-pos'));
    
    // Only update if actually playing with a valid start time
    if (isPlaying && startTime > 0 && startPos >= 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const currentTime = startPos + elapsed;
      display.textContent = `Time: ${formatTime(currentTime)}`;
      
      // Also update lyrics highlight for this room
      const roomControl = display.closest('.room-control');
      if (roomControl) {
        const roomId = roomControl.getAttribute('data-room-id');
        if (roomId) {
          updateLyricsHighlight(roomId, currentTime);
        }
      }
    }
  });
}

// Update local timers every 500ms for smooth display (independent of Firebase updates)
setInterval(updateLocalTimers, 500);

// Escape HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (c) => map[c]);
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    alert('Copy failed. Please copy manually.');
  }
}

// Event listeners
connectBtn.addEventListener('click', connect);
addCodeBtn.addEventListener('click', () => {
  const code = syncCodeInput.value.trim();
  if (!code) {
    alert('Please enter a sync code');
    return;
  }

  try {
    let codes = JSON.parse(localStorage.getItem('christmas_sync_codes') || '[]');
    if (!codes.includes(code.toUpperCase())) {
      codes.push(code.toUpperCase());
      localStorage.setItem('christmas_sync_codes', JSON.stringify(codes));
      alert('Code added successfully');
      loadSavedCodes();
    } else {
      alert('Code already registered');
    }
  } catch (err) {
    console.error('Failed to add code:', err);
    alert('Failed to add code');
  }
});

disconnectBtn.addEventListener('click', disconnect);

copyAllLinksBtn.addEventListener('click', () => {
  if (!state.currentCode) {
    alert('Connect with a sync code first.');
    return;
  }
  const origin = window.location.origin.replace(/\/$/, '');
  const urls = Object.values(ROOM_FILES).map(
    (fileName) => `${origin}/${fileName}?sync-code=${encodeURIComponent(state.currentCode)}`
  );
  copyToClipboard(urls.join('\n'));
});

roomLinksList.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const url = target.getAttribute('data-copy-url');
  if (url) {
    copyToClipboard(url);
  }
});

globalPlayBtn.addEventListener('click', () => sendCommand('play'));
globalPauseBtn.addEventListener('click', () => sendCommand('pause'));
globalStopBtn.addEventListener('click', () => sendCommand('stop'));
globalResetBtn.addEventListener('click', () => sendCommand('reset'));

// Menu toggle functionality
function toggleMenu(): void {
  const isOpen = menuPanel.classList.contains('menu-panel--open');
  if (isOpen) {
    menuPanel.classList.remove('menu-panel--open');
    menuOverlay.classList.remove('menu-overlay--open');
    menuToggleBtn.textContent = '☰';
  } else {
    menuPanel.classList.add('menu-panel--open');
    menuOverlay.classList.add('menu-overlay--open');
    menuToggleBtn.textContent = '✕';
  }
}

menuToggleBtn.addEventListener('click', toggleMenu);
menuOverlay.addEventListener('click', toggleMenu);

// Expose functions globally for onclick handlers
(window as any).connectToCode = connectToCode;
(window as any).removeCode = removeCode;
(window as any).sendCommand = sendCommand;
(window as any).toggleLyrics = toggleLyrics;

// Initialize UI
updateConnectionUI();
loadSavedCodes();
