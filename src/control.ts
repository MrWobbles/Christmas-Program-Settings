import './styles/control.scss';
import { SyncManager, type RoomState } from './sync/SyncManager';
import { getLyrics } from './lyrics/lyricsMap';
import type { TimedLyric } from './lyrics/LyricsManager';
import { ROOMS, ROOM_NAMES, ROOM_FILES, LOCAL_STORAGE_KEYS, TIMINGS, COMMANDS } from './config/constants';
import { copyToClipboard as copyClipboardUtil, isValidSyncCode } from './config/utils';

interface ControlState {
  isConnected: boolean;
  currentCode: string;
  syncManager: SyncManager | null;
  lyricsCache: Record<string, TimedLyric[]>; // Cache loaded lyrics
  activeRoomId: string | null;
}

const state: ControlState = {
  isConnected: false,
  currentCode: '',
  syncManager: null,
  lyricsCache: {},
  activeRoomId: null,
};

const ROOM_ORDER = [ROOMS.EMMANUEL, ROOMS.TWILIGHT, ROOMS.FAITHFUL, ROOMS.JOY, ROOMS.SILENT];
const addedRooms = new Set<string>();

const ROOM_SCRIPTS: Record<string, { lines: { speaker: string; text: string }[]; cue: string }> = {
  'room-emmanuel': {
    lines: [
      {
        speaker: 'Angel (Narrator)',
        text:
          "Before shepherds watched, before Mary believed, before a baby's cry filled Bethlehem, God made a promise. His people waited for hope to come, not in power or armies, but in love. The prophets spoke of a Messiah who would bring light to the darkness.",
      },
      {
        speaker: 'Isaiah',
        text:
          'Read Isaiah 9:6-7<br/>For unto us a Child is born, unto us a Son is given; And the government will be upon His shoulder. And His name will be called Wonderful, Counselor, Mighty God, Everlasting Father, Prince of Peace.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          "From the very beginning, God's plan was redemption. And heaven waited for the day when His Word would become flesh.",
      },
    ],
    cue: 'Cue Singing (O Come Emmanuel)',
  },
  'room-twilight': {
    lines: [
      {
        speaker: 'Angel (Narrator)',
        text:
          'When the time was right, God sent one of us to deliver the message. Gabriel was sent to a young woman named Mary, chosen by grace to bear the Savior.',
      },
      {
        speaker: 'Gabriel',
        text:
          "Luke 1:30-33 (NKJV)<br/>Then the angel said to her, 'Do not be afraid, Mary, for you have found favor with God. And behold, you will conceive in your womb and bring forth a Son, and shall call His name Jesus. He will be great, and will be called the Son of the Highest; and the Lord God will give Him the throne of His father David. And He will reign over the house of Jacob forever, and of His kingdom there will be no end.'",
      },
      {
        speaker: 'Mary',
        text:
          "Luke 1:38 (NKJV)<br/>Then Mary said, 'Behold the maidservant of the Lord! Let it be to me according to your word.' And the angel departed from her.",
      },
      {
        speaker: 'Angel',
        text: 'And Heaven rejoiced. The King was coming to dwell among His people.',
      },
    ],
    cue: 'Sing – Hark the Herald Angels Sing',
  },
  'room-faithful': {
    lines: [
      {
        speaker: 'Angel (Narrator)',
        text:
          'Mary and Joseph obeyed the decree to travel to Bethlehem. Though weary and poor, they followed faithfully, trusting God\'s hand to guide them.',
      },
      {
        speaker: 'Mary',
        text:
          'Luke 2:4-5 (NKJV)<br/>Joseph also went up from Galilee, out of the city of Nazareth, into Judea, to the city of David, which is called Bethlehem, because he was of the house and lineage of David, to be registered with Mary, his betrothed wife, who was with child.',
      },
      {
        speaker: 'Angel (Narrator)',
        text: 'Every step fulfilled prophecy. Every hardship was part of the plan. In the silence of the night, Heaven drew near.',
      },
    ],
    cue: 'Sing – O Come All Ye Faithful',
  },
  'room-joy': {
    lines: [
      {
        speaker: 'Angel (Narrator)',
        text:
          'And then it happened. The night sky opened. The glory of God shone bright, and we filled the heavens with praise.',
      },
      {
        speaker: 'Shepherds',
        text:
          "Luke 2:9-11 (NKJV)<br/>And behold, an angel of the Lord stood before them, and the glory of the Lord shone around them, and they were greatly afraid. Then the angel said to them, 'Do not be afraid, for behold, I bring you good tidings of great joy which will be to all people. For there is born to you this day in the city of David a Savior, who is Christ the Lord.'",
      },
      {
        speaker: 'Angels (all)',
        text:
          "Luke 2:14 (NKJV)<br/>'Glory to God in the highest, And on earth peace, goodwill toward men!'",
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          "The good news was not announced to kings or nobles, but to shepherds. God's message of peace came first to the humble.",
      },
    ],
    cue: 'Sing – Joy to the World',
  },
  'room-silent': {
    lines: [
      {
        speaker: 'Angel (Narrator)',
        text:
          'We\'ve been watching this story unfold for a very long time. Centuries, actually. And tonight, this holy, silent night, is the moment everything changes.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'It started with a promise. Long ago, the prophet Isaiah stood before God\'s people and spoke words that echoed through the ages: "For unto us a Child is born, unto us a Son is given... and His name will be called Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace."',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'For generations, people waited. They wondered. They hoped. When will He come? How will we know Him? But God\'s timing is perfect, and His plan was more beautiful than anyone could have imagined.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'Then came the day Gabriel was sent. I remember it well. The excitement in heaven was overwhelming. He appeared to a young woman named Mary in the little town of Nazareth. An ordinary girl, going about her ordinary day, when suddenly an angel of the Lord stands before her.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'Gabriel said, "Do not be afraid, Mary, for you have found favor with God. You will conceive and give birth to a son, and you are to call Him Jesus. He will be great and will be called the Son of the Most High."',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'And Mary, brave, faithful Mary, she didn\'t run. She didn\'t hide. She simply said, "I am the Lord\'s servant. May your word to me be fulfilled." In that moment, heaven rejoiced. The plan was set in motion.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'Months passed. Mary and Joseph faced whispers, faced judgment, faced uncertainty. But they trusted God. When Caesar decreed that everyone must return to their hometown for a census, they didn\'t complain. They simply obeyed.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'Mary was nine months pregnant, riding on a donkey for 90 miles from Nazareth to Bethlehem. The journey took days. Every bump, every rocky path, but she never lost faith. Joseph walked beside her, protective and faithful, trusting that God was in control.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'When they finally arrived in Bethlehem, the town was bursting with travelers. Every inn was full. Every room was taken. Door after door closed in their faces. "No room. No room. No room." Joseph\'s heart must have sunk with each rejection.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'Finally, someone offered them a stable. Not a guest room. Not even a servant\'s quarters. A stable, where animals ate and slept. The smell of hay and livestock. The cold night air seeping through the cracks. This is where the King of Kings would make His entrance.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'And then it happened. Luke 2:6-7 says it simply: "While they were there, the days were completed for her to be delivered. And she brought forth her firstborn Son, and wrapped Him in swaddling cloths, and laid Him in a manger, because there was no room for them in the inn."',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'But those simple words don\'t capture everything. The moment that baby cried, that first breath, that first sound, creation itself held still. The stars shone brighter. The animals grew quiet. Even we angels paused in wonder.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'Meanwhile, just outside Bethlehem, shepherds were watching their flocks. Ordinary shepherds, doing their ordinary job on what they thought was an ordinary night. And then the glory of the Lord shone around them! We couldn\'t contain ourselves!',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          '"Do not be afraid!" we proclaimed. "We bring you good news that will cause great joy for all the people! Today in the town of David a Savior has been born to you; He is the Messiah, the Lord!" And then suddenly the whole host of heaven appeared, singing "Glory to God in the highest heaven, and on earth peace to those on whom His favor rests!"',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'Those shepherds ran. They RAN to see this thing that had happened. And when they found Mary and Joseph and the baby lying in that manger, they fell to their knees. They understood. This tiny, vulnerable infant was the answer to every prayer, every prophecy, every promise.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'God didn\'t send Jesus to a palace. He didn\'t announce His birth to kings and rulers first. He came in humility, born among the lowly, announced to shepherds. Because this message of hope, this gift of salvation, it\'s for everyone.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'Matthew 1:23 tells us: "Behold, the virgin shall be with child, and bear a Son, and they shall call His name Immanuel," which means "God with us." Not God far away. Not God unreachable. God WITH us. In the flesh. In the mess. In the stable.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'That silent night, holy night, was the hinge of history. Everything before pointed to this moment. Everything after flows from it. The Word became flesh. The Light entered the darkness. Hope was born. Peace arrived. Love came down.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'From Isaiah\'s ancient prophecy to Gabriel\'s announcement, from Mary\'s faithful "yes" to that difficult journey to Bethlehem, from our joyful proclamation to the shepherds to this precious baby wrapped in cloths and lying in a manger, this is the Christmas story.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'This is the story of a God who loved the world so much that He didn\'t stay distant. He came near. He came as a baby. Vulnerable. Dependent. Fully human. And in doing so, He opened the way for all of us to come home.',
      },
      {
        speaker: 'Angel (Narrator)',
        text:
          'So on this silent night, in this holy moment, we remember: All is calm. All is bright. The Prince of Peace has come. Emmanuel. God is with us. And He always will be.',
      },
    ],
    cue: 'Sing – Silent Night',
  },
};

// DOM Elements
const menuToggleBtn = document.getElementById('menuToggleBtn')!;
const menuOverlay = document.getElementById('menuOverlay')!;
const menuPanel = document.getElementById('menuPanel')!;

// Set initial ARIA attributes
menuToggleBtn.setAttribute('aria-expanded', 'false');
menuToggleBtn.setAttribute('aria-label', 'Toggle menu');

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
const roomNav = document.getElementById('roomNav')!;
const globalPlayBtn = document.getElementById('globalPlayBtn')!;
const globalPauseBtn = document.getElementById('globalPauseBtn')!;
const globalStopBtn = document.getElementById('globalStopBtn')!;
const globalResetBtn = document.getElementById('globalResetBtn')!;
const roomLinksList = document.getElementById('roomLinksList')!;
const copyAllLinksBtn = document.getElementById('copyAllLinksBtn')!;

// Load saved codes on page load
function loadSavedCodes(): void {
  try {
    const codesJson = localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC_CODES);
    const codes = codesJson ? JSON.parse(codesJson) : [];

    if (codes.length === 0) {
      codesHint.style.display = 'block';
      return;
    }

    codesHint.style.display = 'none';
    codesList.innerHTML = codes
      .map(
        (code: string) => `
      <div class="code-item" data-code="${escapeHtml(code)}">
        <span class="code-text">${escapeHtml(code)}</span>
        <button class="btn btn-small btn-outline code-connect-btn">Connect</button>
        <button class="btn btn-small btn-outline btn-danger code-remove-btn">Remove</button>
      </div>
    `
      )
      .join('');

    // Add event listeners to buttons using event delegation
    codesList.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const item = target.closest('.code-item');
      if (!item) return;

      const code = item.getAttribute('data-code');
      if (!code) return;

      if (target.classList.contains('code-connect-btn')) {
        connectToCode(code);
      } else if (target.classList.contains('code-remove-btn')) {
        removeCode(code);
      }
    });
  } catch (err) {
    console.error('Failed to load saved codes:', err);
  }
}

function renderScript(roomId: string): string {
  const script = ROOM_SCRIPTS[roomId];
  if (!script) return '';

  const lines = script.lines
    .map(
      (line) => `
        <div class="room-script__line">
          <span class="room-script__speaker">${escapeHtml(line.speaker)}:</span>
          <span class="room-script__text">${line.text}</span>
        </div>
      `
    )
    .join('');

  return `
    <div class="room-script">
      <div class="room-script__header">Script</div>
      <div class="room-script__body">${lines}</div>
      <div class="room-script__cue">${escapeHtml(script.cue)}</div>
    </div>
  `;
}

// Render room navigation and wire up selection
function renderRoomNav(roomIds: string[]): void {
  if (!roomNav) return;

  if (roomIds.length === 0) {
    roomNav.innerHTML = '';
    state.activeRoomId = null;
    updateActiveRoomVisibility();
    return;
  }

  if (!state.activeRoomId || !roomIds.includes(state.activeRoomId)) {
    state.activeRoomId = roomIds[0] || null;
  }

  roomNav.innerHTML = roomIds
    .map(
      (roomId) => `
        <button
          class="room-nav__btn${roomId === state.activeRoomId ? ' room-nav__btn--active' : ''}"
          data-room-id="${roomId}"
          aria-pressed="${roomId === state.activeRoomId}"
          type="button"
        >
          ${escapeHtml(ROOM_NAMES[roomId] || roomId)}
        </button>
      `
    )
    .join('');

  const buttons = roomNav.querySelectorAll('.room-nav__btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const roomId = btn.getAttribute('data-room-id');
      if (roomId) {
        setActiveRoom(roomId);
      }
    });
  });

  updateActiveRoomVisibility();
}

function setActiveRoom(roomId: string): void {
  if (!roomId) return;
  state.activeRoomId = roomId;
  updateNavActiveState();
  updateActiveRoomVisibility();
}

function updateNavActiveState(): void {
  if (!roomNav) return;
  const buttons = roomNav.querySelectorAll('.room-nav__btn');
  buttons.forEach((btn) => {
    const btnRoomId = btn.getAttribute('data-room-id');
    const isActive = btnRoomId === state.activeRoomId;
    btn.classList.toggle('room-nav__btn--active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

function updateActiveRoomVisibility(): void {
  const controls = roomControlsContainer.querySelectorAll('.room-control');
  controls.forEach((control) => {
    const roomId = control.getAttribute('data-room-id');
    const isActive = roomId === state.activeRoomId;
    control.classList.toggle('room-control--hidden', !isActive);
  });
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
      const codesJson = localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC_CODES);
      let codes = codesJson ? JSON.parse(codesJson) : [];
      codes = codes.filter((c: string) => c !== code);
      localStorage.setItem(LOCAL_STORAGE_KEYS.SYNC_CODES, JSON.stringify(codes));
      loadSavedCodes();
    } catch (err) {
      console.error('Failed to remove code:', err);
      alert('Failed to remove code');
    }
  }
}

// Connect to sync system
async function connect(): Promise<void> {
  const code = syncCodeInput.value.trim().toUpperCase();

  if (!code) {
    alert('Please enter a sync code');
    return;
  }

  if (!isValidSyncCode(code)) {
    alert('Invalid sync code: must be 3-20 characters, letters/numbers/hyphens only');
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

  // Determine base path from current location
  // If control.html is at /path/to/control.html, extract /path/to/
  const currentPath = window.location.pathname;
  const pathParts = currentPath.split('/').filter(p => p); // Remove empty parts
  pathParts.pop(); // Remove the filename (control.html or control)
  const basePath = pathParts.length > 0 ? '/' + pathParts.join('/') + '/' : '/';
  
  const origin = window.location.origin.replace(/\/$/, '');
  const items = ROOM_ORDER
    .map(roomId => [roomId, ROOM_FILES[roomId]] as const)
    .filter(([, fileName]) => fileName) // Only include rooms that have files
    .map(([roomId, fileName]) => {
      const url = `${origin}${basePath}${fileName}?sync-code=${encodeURIComponent(state.currentCode)}`;
      return `
        <div class="room-link-item">
          <div class="room-link-meta">
            <strong>${escapeHtml(ROOM_NAMES[roomId] || roomId)}</strong>
            <a href="${url}" target="_blank" class="room-link-url">${escapeHtml(url)}</a>
          </div>
          <div class="room-link-actions">
            <button class="btn btn-small btn-outline" data-copy-url="${escapeHtml(url)}" title="Copy to clipboard">Copy</button>
            <button class="btn btn-small btn-outline" data-share-messenger="${escapeHtml(url)}" title="Share via Facebook Messenger">Share</button>
          </div>
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

// Update room status display (only updates status, not controls structure)
function updateRoomStatus(roomStatuses: Record<string, RoomState>): void {
  const activeRooms = Object.values(roomStatuses);
  activeRooms.forEach(room => addedRooms.add(room.roomId));

  const sortedRooms = ROOM_ORDER
    .filter(roomId => addedRooms.has(roomId))
    .map(roomId => {
      return roomStatuses[roomId] || {
        roomId,
        isActive: false,
        isPlaying: false,
        currentTime: 0,
        isActivated: false,
        lastUpdate: 0
      };
    });

  if (sortedRooms.length === 0) {
    noRoomsMessage.style.display = 'block';
    roomControlsContainer.innerHTML = '';
    roomNav.innerHTML = '';
    state.activeRoomId = null;
    return;
  }

  noRoomsMessage.style.display = 'none';
  renderRoomNav(sortedRooms.map(room => room.roomId));

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

  // Rebuild if number of rooms changed (new room added) or container is empty
  const currentRoomCount = roomControlsContainer.children.length;
  if (currentRoomCount === 0 || currentRoomCount !== sortedRooms.length) {
    roomControlsContainer.innerHTML = sortedRooms
      .map(
        (room) => {
          // Determine border color: green = playing, yellow = paused, red = stopped
          let borderColor = 'yellow';
          if (room.isActive && room.isPlaying) {
            borderColor = 'green';
          } else if (room.isActive && room.currentTime === 0 && !room.isPlaying) {
            borderColor = 'red';
          } else if (!room.isActive) {
            borderColor = 'gray'; // offline
          }

          // Calculate current time locally if playing (reduces Firebase reads)
          let currentTime = room.currentTime;
          if (room.isActive && room.isPlaying && room.playStartTime && room.playStartPosition !== undefined) {
            const elapsed = (Date.now() - room.playStartTime) / 1000;
            currentTime = room.playStartPosition + elapsed;
          }

          const wasOpen = existingState[room.roomId]?.open || false;
          const expandedClass = wasOpen ? ' room-control--expanded' : '';
          const isActiveRoom = room.roomId === state.activeRoomId;
          const hiddenClass = isActiveRoom ? '' : ' room-control--hidden';
          const toggleLabel = wasOpen ? 'Hide Lyrics' : 'Show Lyrics';
          const scriptHtml = renderScript(room.roomId);

          return `
    <div class="room-control room-control--${borderColor}${expandedClass}${hiddenClass}" data-room-id="${room.roomId}" data-song-id="${room.songId || ''}" data-lyrics-open="${wasOpen}">
      <span class="play-indicator" style="display: ${room.isActive && room.isPlaying ? 'block' : 'none'}">▶</span>
      <div class="room-control-header">
        <div class="room-control-title">
          <h4>${escapeHtml(ROOM_NAMES[room.roomId] || room.roomId)}</h4>
          <button class="btn btn-small btn-danger" onclick="removeRoom('${room.roomId}')" title="Remove from list">✕</button>
        </div>
        <div class="room-status-inline">
          <span class="status-badge status-badge--${room.isActive ? 'active' : 'inactive'}">
            ${room.isActive ? 'Connected' : 'Disconnected'}
          </span>
          ${!room.isActive ? '<span class="status-info" style="color: #ff9800;">Refresh room page to reconnect</span>' : ''}
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
      ${scriptHtml}
      <div class="room-lyrics-display">
        <div class="lyrics-content"></div>
      </div>
    </div>
  `;
        }
      )
      .join('');

    updateActiveRoomVisibility();
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
        const wasHidden = roomControl.classList.contains('room-control--hidden');
        const expandedClass = wasExpanded ? ' room-control--expanded' : '';
        const hiddenClass = wasHidden ? ' room-control--hidden' : '';
        roomControl.className = `room-control room-control--${borderColor}${expandedClass}${hiddenClass}`;
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

    updateNavActiveState();
    updateActiveRoomVisibility();
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

  let activeIdx = -1;

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
setInterval(updateLocalTimers, TIMINGS.LOCAL_TIMER_UPDATE);

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

async function copyToClipboard(text: string, button?: HTMLElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    // Flash the button green
    if (button) {
      button.style.backgroundColor = '#4CAF50';
      setTimeout(() => {
        button.style.backgroundColor = '';
      }, 400);
    }
  } catch (err) {
    console.error('Clipboard copy failed:', err);
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
    let codes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC_CODES) || '[]');
    if (!codes.includes(code.toUpperCase())) {
      codes.push(code.toUpperCase());
      localStorage.setItem(LOCAL_STORAGE_KEYS.SYNC_CODES, JSON.stringify(codes));
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

copyAllLinksBtn.addEventListener('click', (e) => {
  if (!state.currentCode) {
    alert('Connect with a sync code first.');
    return;
  }
  
  // Determine base path from current location
  const currentPath = window.location.pathname;
  const pathParts = currentPath.split('/').filter(p => p);
  pathParts.pop();
  const basePath = pathParts.length > 0 ? '/' + pathParts.join('/') + '/' : '/';
  
  const origin = window.location.origin.replace(/\/$/, '');
  const urls = Object.values(ROOM_FILES).map(
    (fileName) => `${origin}${basePath}${fileName}?sync-code=${encodeURIComponent(state.currentCode)}`
  );
  copyToClipboard(urls.join('\n'), e.target as HTMLElement);
});

roomLinksList.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const url = target.getAttribute('data-copy-url');
  if (url) {
    copyToClipboard(url, target);
  }
  
  const messengerUrl = target.getAttribute('data-share-messenger');
  if (messengerUrl) {
    // Open Facebook Messenger with the link in a new tab
    // User can then select who to send it to
    const encodedUrl = encodeURIComponent(messengerUrl);
    window.open(`https://www.messenger.com/?link=${encodedUrl}`, '_blank', 'width=800,height=600');
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
    menuToggleBtn.setAttribute('aria-expanded', 'false');
  } else {
    menuPanel.classList.add('menu-panel--open');
    menuOverlay.classList.add('menu-overlay--open');
    menuToggleBtn.textContent = '✕';
    menuToggleBtn.setAttribute('aria-expanded', 'true');
  }
}

// Remove a room card from view (will return on next status refresh)
function removeRoom(roomId: string): void {
  if (confirm(`Remove ${ROOM_NAMES[roomId] || roomId} from the list?`)) {
    addedRooms.delete(roomId);
    const roomControl = roomControlsContainer.querySelector(`[data-room-id="${roomId}"]`);
    if (roomControl) {
      roomControl.remove();
    }

    const remaining = Array.from(addedRooms);
    renderRoomNav(remaining);
    updateActiveRoomVisibility();
    if (!remaining.length) {
      noRoomsMessage.style.display = 'block';
    }
  }
}

menuToggleBtn.addEventListener('click', toggleMenu);
menuOverlay.addEventListener('click', toggleMenu);

// Expose functions to global scope for inline onclick handlers
(window as any).sendCommand = sendCommand;
(window as any).toggleLyrics = toggleLyrics;
(window as any).seekToTime = seekToTime;
(window as any).removeRoom = removeRoom;
(window as any).setActiveRoom = setActiveRoom;

// Initialize UI
updateConnectionUI();
loadSavedCodes();
