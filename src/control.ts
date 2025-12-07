import { SyncManager, type RoomState } from './sync/SyncManager';

interface ControlState {
  isConnected: boolean;
  currentCode: string;
  syncManager: SyncManager | null;
}

const state: ControlState = {
  isConnected: false,
  currentCode: '',
  syncManager: null,
};

const ROOM_NAMES: Record<string, string> = {
  'room-emmanuel': 'Room 1: Emmanuel',
  'room-twilight': 'Room 2: Twilight',
  'room-faithful': 'Room 3: Faithful',
  'room-joy': 'Room 4: Joy',
};

// DOM Elements
const codeSetupSection = document.getElementById('codeSetupSection')!;
const playbackSection = document.getElementById('playbackSection')!;
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
    startStatusPolling();
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
    renderRoomLinks();
  } else {
    codeSetupSection.style.display = 'block';
    playbackSection.style.display = 'none';
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

// Poll for room status updates
function startStatusPolling(): void {
  const pollInterval = setInterval(async () => {
    if (!state.isConnected) {
      clearInterval(pollInterval);
      return;
    }

    if (!state.syncManager) return;

    const roomStatuses = await state.syncManager.getAllRoomStatuses();
    updateRoomStatus(roomStatuses);
  }, 1000);
}

// Update room status display
function updateRoomStatus(roomStatuses: Record<string, RoomState>): void {
  const activeRooms = Object.values(roomStatuses);

  if (activeRooms.length === 0) {
    roomStatusGrid.innerHTML = '';
    noRoomsMessage.style.display = 'block';
    roomControlsContainer.innerHTML = '';
    return;
  }

  noRoomsMessage.style.display = 'none';

  // Update status grid
  roomStatusGrid.innerHTML = activeRooms
    .map(
      (room) => `
    <div class="room-status-card">
      <h4>${escapeHtml(ROOM_NAMES[room.roomId] || room.roomId)}</h4>
      <div class="room-status-content">
        <p><strong>Status:</strong> ${room.isActive ? '🟢 Active' : '🔴 Inactive'}</p>
        <p><strong>Playing:</strong> ${room.isPlaying ? '▶️ Yes' : '⏸️ No'}</p>
        <p><strong>Time:</strong> ${formatTime(room.currentTime)}</p>
        <p><strong>Activated:</strong> ${room.isActivated ? '✓ Yes' : '✗ No'}</p>
      </div>
    </div>
  `
    )
    .join('');

  // Update per-room controls
  roomControlsContainer.innerHTML = activeRooms
    .map(
      (room) => `
    <div class="room-control">
      <h4>${escapeHtml(ROOM_NAMES[room.roomId] || room.roomId)}</h4>
      <div class="room-buttons">
        <button class="btn btn-small btn-success" onclick="sendCommand('play', '${room.roomId}')">Play</button>
        <button class="btn btn-small btn-warning" onclick="sendCommand('pause', '${room.roomId}')">Pause</button>
        <button class="btn btn-small btn-danger" onclick="sendCommand('stop', '${room.roomId}')">Stop</button>
        <button class="btn btn-small btn-info" onclick="sendCommand('activate', '${room.roomId}')">Activate</button>
        <button class="btn btn-small btn-outline" onclick="sendCommand('reset', '${room.roomId}')">Reset</button>
      </div>
    </div>
  `
    )
    .join('');
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

// Format time
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

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

// Expose functions globally for onclick handlers
(window as any).connectToCode = connectToCode;
(window as any).removeCode = removeCode;
(window as any).sendCommand = sendCommand;

// Initialize UI
updateConnectionUI();
loadSavedCodes();
