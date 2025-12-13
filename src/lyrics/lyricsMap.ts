import type { TimedLyric } from './LyricsManager';

// Lazy load lyrics to avoid bundling them all upfront
export const lyricsMap: Record<string, () => Promise<TimedLyric[]>> = {
  'o-come-o-come-emmanuel': async () => {
    const mod = await import('./o-come-o-come-emmanuel');
    return mod.default;
  },
  'hark-herald-angels': async () => {
    const mod = await import('./hark-herald-angels');
    return mod.default;
  },
  'o-come-all-ye-faithful': async () => {
    const mod = await import('./o-come-all-ye-faithful');
    return mod.default;
  },
  'joy-to-the-world': async () => {
    const mod = await import('./joy-to-the-world');
    return mod.default;
  },
  'silent-night': async () => {
    const mod = await import('./silent-night');
    return mod.default;
  },
};

export async function getLyrics(songId: string): Promise<TimedLyric[] | null> {
  const loader = lyricsMap[songId];
  if (!loader) {
    console.warn(`[Lyrics] No lyrics found for song: ${songId}`);
    return null;
  }
  try {
    return await loader();
  } catch (err) {
    console.error(`[Lyrics] Failed to load lyrics for ${songId}:`, err);
    return null;
  }
}
