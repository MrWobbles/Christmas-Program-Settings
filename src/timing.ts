import './styles/timing.scss';

interface LyricLine {
  line: string;
  time?: number;
  marked: boolean;
}

interface TimingState {
  currentTrack: string | null;
  lyrics: LyricLine[];
  currentLineIndex: number;
}

const state: TimingState = {
  currentTrack: null,
  lyrics: [],
  currentLineIndex: -1,
};

// DOM Elements
const tracksList = document.getElementById('tracksList')!;
const lyricsInputSection = document.getElementById('lyricsInputSection')!;
const playerSection = document.getElementById('playerSection')!;
const timingControls = document.getElementById('timingControls')!;
const outputSection = document.getElementById('outputSection')!;
const existingLyricsButtons = document.getElementById('existingLyricsButtons')!;

const audioPlayer = document.getElementById('audioPlayer') as HTMLAudioElement;
const trackName = document.getElementById('trackName')!;
const trackFilename = document.getElementById('trackFilename')!;
const playBtn = document.getElementById('playBtn')!;
const pauseBtn = document.getElementById('pauseBtn')!;
const stopBtn = document.getElementById('stopBtn')!;
const currentTime = document.getElementById('currentTime')!;
const duration = document.getElementById('duration')!;
const progressSlider = document.getElementById('progressSlider') as HTMLInputElement;
const currentTimeLarge = document.getElementById('currentTimeLarge')!;
const currentLineDisplay = document.getElementById('currentLineDisplay')!;
const lyricsList = document.getElementById('lyricsList')!;
const lyricsInput = document.getElementById('lyricsInput') as HTMLTextAreaElement;
const loadLyricsBtn = document.getElementById('loadLyricsBtn')!;
const undoBtn = document.getElementById('undoBtn')!;
const clearBtn = document.getElementById('clearBtn')!;
const exportBtn = document.getElementById('exportBtn')!;
const copyTsBtn = document.getElementById('copyTsBtn')!;
const tsOutput = document.getElementById('tsOutput')!;

// Existing lyrics that can be loaded
const existingLyrics = {
  'hark-herald-angels': 'Hark the Herald Angels Sing',
  'o-come-all-ye-faithful': 'O Come All Ye Faithful',
  'o-come-o-come-emmanuel': 'O Come O Come Emmanuel',
  'joy-to-the-world': 'Joy to the World',
};

// List available MP3 files
function loadAudioFiles(): void {
  const mp3Files = [
    { path: './audio/Hark the Herald Angels Sing.mp3', name: 'Hark the Herald Angels Sing' },
    { path: './audio/Joy to the World.mp3', name: 'Joy to the World' },
    { path: './audio/O Come All Ye Faithful.mp3', name: 'O Come All Ye Faithful' },
    { path: './audio/O Come O Come Emmanuel.mp3', name: 'O Come O Come Emmanuel' },
  ];

  if (mp3Files.length === 0) {
    tracksList.innerHTML = '<p class="error-message">No MP3 files configured</p>';
    return;
  }

  tracksList.innerHTML = '';
  mp3Files.forEach((file) => {
    const button = document.createElement('button');
    button.className = 'btn btn-track';
    button.textContent = file.name;
    button.addEventListener('click', () => selectTrack(file.path, file.name));
    tracksList.appendChild(button);
  });
}

// Select a track to time
function selectTrack(filePath: string, displayName: string): void {
  state.currentTrack = filePath;
  state.lyrics = [];
  state.currentLineIndex = -1;

  trackName.textContent = displayName;
  trackFilename.textContent = filePath;

  audioPlayer.src = filePath;
  currentTime.textContent = '0.00';

  playerSection.style.display = 'block';
  lyricsInputSection.style.display = 'block';
  timingControls.style.display = 'none';
  outputSection.style.display = 'none';

  audioPlayer.addEventListener(
    'loadedmetadata',
    () => {
      duration.textContent = audioPlayer.duration.toFixed(2);
      progressSlider.max = audioPlayer.duration.toString();
    },
    { once: true }
  );
}

// Load lyrics from textarea
loadLyricsBtn.addEventListener('click', () => {
  const text = lyricsInput.value.trim();
  if (!text) {
    alert('Please paste lyrics first');
    return;
  }

  const lines = text.split('\n').filter((line) => line.trim());
  state.lyrics = lines.map((line) => ({
    line: line.trim(),
    marked: false,
  }));

  state.currentLineIndex = 0;
  updateLyricsDisplay();
  timingControls.style.display = 'block';
  currentLineDisplay.textContent = state.lyrics[0]?.line || 'Done!';
});

// Load existing lyrics from TS files
async function loadExistingLyrics(songId: string): Promise<void> {
  try {
    let lyrics: any[] = [];

    // Dynamically import the lyrics file
    if (songId === 'hark-herald-angels') {
      lyrics = (await import('./lyrics/hark-herald-angels')).default;
    } else if (songId === 'o-come-all-ye-faithful') {
      lyrics = (await import('./lyrics/o-come-all-ye-faithful')).default;
    } else if (songId === 'o-come-o-come-emmanuel') {
      lyrics = (await import('./lyrics/o-come-o-come-emmanuel')).default;
    } else if (songId === 'joy-to-the-world') {
      lyrics = (await import('./lyrics/joy-to-the-world')).default;
    }

    // Convert to our format
    state.lyrics = lyrics.map((lyric) => ({
      line: lyric.text || lyric.line || '',
      time: lyric.start,
      marked: false,
    }));

    state.currentLineIndex = 0;
    updateLyricsDisplay();
    timingControls.style.display = 'block';
    currentLineDisplay.textContent = 'Lyrics loaded! Ready to re-time.';
    outputSection.style.display = 'block';
    updateTypeScriptOutput();
  } catch (err) {
    alert('Failed to load lyrics: ' + err);
    console.error(err);
  }
}

// Populate existing lyrics buttons
function populateExistingLyricsButtons(): void {
  existingLyricsButtons.innerHTML = '';
  Object.entries(existingLyrics).forEach(([songId, displayName]) => {
    const button = document.createElement('button');
    button.className = 'btn btn-secondary';
    button.textContent = displayName;
    button.addEventListener('click', () => loadExistingLyrics(songId));
    existingLyricsButtons.appendChild(button);
  });
}

// Update time display
audioPlayer.addEventListener('timeupdate', () => {
  const time = audioPlayer.currentTime;
  currentTime.textContent = time.toFixed(2);
  currentTimeLarge.textContent = time.toFixed(2) + 's';
  progressSlider.value = time.toString();
});

// Sync progress slider with audio
progressSlider.addEventListener('input', () => {
  audioPlayer.currentTime = parseFloat(progressSlider.value);
});

// Player controls
playBtn.addEventListener('click', () => audioPlayer.play());
pauseBtn.addEventListener('click', () => audioPlayer.pause());
stopBtn.addEventListener('click', () => {
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
});

// Mark timestamp for current line on spacebar
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && state.currentLineIndex >= 0 && state.currentLineIndex < state.lyrics.length && state.currentTrack) {
    e.preventDefault();

    const time = audioPlayer.currentTime;
    const line = state.lyrics[state.currentLineIndex];

    line.time = Math.floor(time);
    line.marked = true;

    // Move to next line
    state.currentLineIndex++;
    updateLyricsDisplay();

    if (state.currentLineIndex < state.lyrics.length) {
      currentLineDisplay.textContent = state.lyrics[state.currentLineIndex].line;
    } else {
      currentLineDisplay.textContent = '✓ Done! All lines marked.';
      outputSection.style.display = 'block';
      updateTypeScriptOutput();
    }
  }
});

// Update lyrics display
function updateLyricsDisplay(): void {
  if (state.lyrics.length === 0) {
    lyricsList.innerHTML = '<p class="no-lyrics">No lyrics loaded</p>';
    return;
  }

  lyricsList.innerHTML = state.lyrics
    .map(
      (lyric, index) => `
    <div class="lyric-line ${lyric.marked ? 'lyric-line--marked' : ''} ${index === state.currentLineIndex ? 'lyric-line--current' : ''}" data-index="${index}" style="${lyric.marked ? 'cursor: pointer;' : ''}">
      <span class="lyric-number">${index + 1}</span>
      <span class="lyric-text">${lyric.line}</span>
      ${lyric.marked ? `<span class="lyric-time">${lyric.time}s</span>` : '<span class="lyric-pending">Waiting...</span>'}
    </div>
  `
    )
    .join('');

  // Add click handlers to marked lines
  document.querySelectorAll('.lyric-line[data-index]').forEach((element) => {
    const index = parseInt(element.getAttribute('data-index')!);
    if (state.lyrics[index].marked) {
      element.addEventListener('click', () => goBackToLine(index));
    }
  });
}

// Go back to a specific line and unmark all subsequent lines
function goBackToLine(lineIndex: number): void {
  // Unmark all lines AFTER this one (not including it)
  for (let i = lineIndex + 1; i < state.lyrics.length; i++) {
    state.lyrics[i].marked = false;
  }

  // Set current line to the NEXT line (the one after clicked)
  state.currentLineIndex = lineIndex + 1;

  // Jump audio to the time of the clicked line
  if (state.lyrics[lineIndex].time !== undefined) {
    audioPlayer.currentTime = state.lyrics[lineIndex].time!;
  }

  updateLyricsDisplay();
  currentLineDisplay.textContent = state.lyrics[lineIndex + 1]?.line || 'Done!';
  updateTypeScriptOutput();
}

// Undo last timestamp
undoBtn.addEventListener('click', () => {
  if (state.currentLineIndex > 0) {
    state.currentLineIndex--;
    state.lyrics[state.currentLineIndex].marked = false;
    state.lyrics[state.currentLineIndex].time = undefined;
    updateLyricsDisplay();
    currentLineDisplay.textContent = state.lyrics[state.currentLineIndex].line;
    outputSection.style.display = 'none';
  }
});

// Clear all timestamps
clearBtn.addEventListener('click', () => {
  if (confirm('Clear all timestamps?')) {
    state.lyrics.forEach((lyric) => {
      lyric.marked = false;
      lyric.time = undefined;
    });
    state.currentLineIndex = 0;
    updateLyricsDisplay();
    currentLineDisplay.textContent = state.lyrics[0]?.line || 'Done!';
    outputSection.style.display = 'none';
  }
});

// Generate TypeScript output
function updateTypeScriptOutput(): void {
  const trackId = (state.currentTrack || '').split('/').pop()?.replace(/\.mp3$/, '').toLowerCase() || 'song';

  const code = `import type { TimedLyric } from './LyricsManager';

const lyrics: TimedLyric[] = [
${state.lyrics.map((lyric) => `  { start: ${lyric.time}, text: '${lyric.line.replace(/'/g, "\\'")}' }`).join(',\n')}
];

export default lyrics;`;

  tsOutput.textContent = code;
}

// Copy TypeScript to clipboard
exportBtn.addEventListener('click', () => {
  if (state.lyrics.every((l) => l.marked)) {
    updateTypeScriptOutput();
    outputSection.style.display = 'block';
  } else {
    alert('Please mark all lyrics before exporting');
  }
});

copyTsBtn.addEventListener('click', () => {
  const text = tsOutput.textContent;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      copyTsBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        copyTsBtn.textContent = 'Copy to Clipboard';
      }, 2000);
    })
    .catch((err) => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
});

// Initialize
loadAudioFiles();
populateExistingLyricsButtons();
