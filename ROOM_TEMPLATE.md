# Room Structure Template

## Overview
This document describes the pattern for creating new rooms in the Christmas Program Settings project. Each room is self-contained with its own initialization, starfield/scenery, and optional characters.

## File Structure
When adding a new room, create the following files:

```
root/
├── room{N}.html                    # Room entry point
└── src/
    ├── room/
    │   └── room-{name}.ts          # Room initialization & classes
    ├── lyrics/
    │   └── {song-key}.ts           # Song lyrics (if new song)
    └── styles/
        └── rooms/
            └── _room-{name}.scss   # Room-specific styles
```

## Step-by-Step Guide

### 1. Create HTML Entry Point: `room{N}.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Room {N} - {Theme}</title>
</head>
<body class="room-{name}" data-song="{song-key}">
    <canvas class="canvas"></canvas>
    <!-- Room-specific elements (characters, silhouettes, etc.) -->
    <div class="silhouette"></div>
    <div class="vignette"></div>
    <div class="lyrics-box">
        <div class="lyrics-box__text"></div>
    </div>
    <div class="media-bar">
        <div class="media-bar__time-display">00:00 / 00:00</div>
        <audio id="carol-audio" src="/audio/{song-file}" preload="auto"></audio>
    </div>
    <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Important:**
- `body class="room-{name}"` — Used for dynamic room detection in `main.ts`
- `data-song="{song-key}"` — Must match the lyrics file name (without `.ts`)
- Canvas, audio, and lyrics box are required and shared across all rooms
- Add room-specific elements (characters, decorations) inside body

### 2. Create Room Initialization: `src/room/room-{name}.ts`

```typescript
import type { LyricsManager } from '../lyrics/LyricsManager';

// Define room-specific classes (e.g., Starfield, Characters, etc.)
class CustomStarfield {
  // Implementation specific to this room
}

// Export initialization function with standard signature
export function initRoom{N}(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  lyricsManager: LyricsManager
): void {
  // 1. Initialize scenery/starfield
  new CustomStarfield(canvas, ctx);

  // 2. Initialize characters if present
  const characters = document.querySelectorAll('[data-character]');
  if (characters.length > 0) {
    // Set up character interactions
  }

  // 3. Set up click handler
  let audioStarted = false;
  document.body.addEventListener('click', (e: MouseEvent) => {
    // Skip UI elements
    if ((e.target as HTMLElement).closest('.lyrics-box') || 
        (e.target as HTMLElement).closest('.media-bar')) {
      return;
    }

    if (!audioStarted) {
      audioStarted = true;
      const audioEl = document.getElementById('carol-audio') as HTMLAudioElement | null;
      if (audioEl) {
        lyricsManager.show();
        audioEl.currentTime = 0; // or offset for this room
        audioEl.play().catch((err) => console.error('Audio play error:', err));
      }
    }
  });
}
```

**Key Points:**
- Import `LyricsManager` type for proper TypeScript support
- Use standard function signature for consistency
- All room-specific logic goes in this file
- Handle click events appropriately for your room's interaction pattern

### 3. Create Lyrics File (if new song): `src/lyrics/{song-key}.ts`

```typescript
import type { TimedLyric } from './LyricsManager';

const lyrics: TimedLyric[] = [
  { start: 0, text: 'First line' },
  { start: 5, text: 'Second line' },
  // ... more lyrics with timestamps
];

export default lyrics;
```

**Important:**
- Use `text` property for flexibility (also supports `line`)
- `start` is in seconds
- Export as `default`

### 4. Create Room Styles: `src/styles/rooms/_room-{name}.scss`

```scss
.room-{name} {
  background-image: url('/img/Room{N}.png');
  // Or custom background
  background: linear-gradient(135deg, #color1, #color2);
  
  // Room-specific element overrides
  .lyrics-box {
    // customize positioning if needed
  }
}
```

This file is auto-imported in `src/styles/rooms/index.scss`.

### 5. Update Configuration Files

**Update `vite.config.ts`:**
Add room entry point to rollupOptions input:
```typescript
input: {
  room1: resolve(__dirname, 'room1.html'),
  room2: resolve(__dirname, 'room2.html'),
  room{N}: resolve(__dirname, 'room{N}.html')  // Add this line
}
```

**Update `src/main.ts`:**
If needed, add new room detection logic:
```typescript
if (roomClass.includes('room-{name}')) {
  const { initRoom{N} } = await import('./room/room-{name}');
  initRoom{N}(canvas as HTMLCanvasElement, ctx as CanvasRenderingContext2D, lyricsManager);
}
```
*(This is optional if you follow the naming pattern—main.ts already handles dynamic loading based on room class)*

### 6. Update Room Index (if using auto-import)

If new styles need importing, add to `src/styles/rooms/index.scss`:
```scss
@import './_room-{name}';
```

## Room Interaction Patterns

### Pattern 1: Single-Click (e.g., Emmanuel)
- One click anywhere on canvas → show lyrics + start audio
- Good for simple scenes focused on lyrics

### Pattern 2: Multi-Click (e.g., Twilight)
- Click 1: Show scene elements (characters, etc.)
- Click 2: Start audio + show lyrics
- Good for interactive scenes with setup

### Pattern 3: Custom
- Implement any interaction pattern in your room's click handler
- Always check for `.lyrics-box` and `.media-bar` clicks to skip

## Testing Checklist

- [ ] HTML entry point created and accessible
- [ ] Room class (`room-{name}`) present on body
- [ ] `data-song` attribute matches lyrics file name
- [ ] Lyrics file exports default with correct `TimedLyric` format
- [ ] Room initialization function exports correctly
- [ ] Room init added to vite.config.ts input
- [ ] No TypeScript errors: `tsc --noEmit`
- [ ] Dev server starts: `npm run dev`
- [ ] Room loads correctly with `npm run dev` and navigate to `/room{N}.html`
- [ ] Clicking canvas triggers expected interaction
- [ ] Clicking lyric lines seeks to correct timestamps
- [ ] Audio plays without errors
- [ ] Build succeeds: `npm run build`

## Files NOT Requiring Updates

These are shared across all rooms and don't need modification:
- `src/main.ts` — handles dynamic room loading (usually)
- `src/lyrics/LyricsManager.ts` — shared lyrics system
- `src/styles/_overlays.scss` — shared UI elements
- `src/styles/_common.scss` — shared base styles

## Quick Copy Template

To quickly scaffold a new room, copy `room2.html` and `src/room/room-twilight.ts`, then:
1. Rename files to `room{N}.html` and `room-{name}.ts`
2. Update class names and exports
3. Add new lyrics file for new song
4. Implement room-specific logic in initialization function
5. Add entry to vite.config.ts

That's it! The rest is handled automatically.
