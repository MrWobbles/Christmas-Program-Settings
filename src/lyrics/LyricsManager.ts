export type TimedLyric = { start: number; line?: string; text?: string };

export class LyricsManager {
  private lyricsBox: HTMLElement;
  private lyricsText: HTMLElement;
  private audioEl: HTMLAudioElement;
  private timeDisplay: HTMLElement;
  private timedLyrics: Array<{ start: number; line: string }> = [];
  private currentIdx = -1;

  constructor(
    lyricsBox: HTMLElement,
    lyricsText: HTMLElement,
    audioEl: HTMLAudioElement,
    timeDisplay: HTMLElement
  ) {
    this.lyricsBox = lyricsBox;
    this.lyricsText = lyricsText;
    this.audioEl = audioEl;
    this.timeDisplay = timeDisplay;

    this.audioEl.addEventListener('timeupdate', () => this.handleTimeUpdate());
    this.audioEl.addEventListener('loadedmetadata', () => this.handleMetadataLoaded());
  }

  setLyrics(lyrics: TimedLyric[]): void {
    this.timedLyrics = lyrics.map((entry) => ({
      start: this.parseTime(entry.start),
      line: entry.line || entry.text || ''
    }));
    this.currentIdx = -1;
    // Clear existing lyrics DOM elements before rendering new ones
    this.lyricsText.innerHTML = '';
    this.renderLyrics(-1);
  }

  show(): void {
    this.lyricsBox.classList.add('show');
  }

  private parseTime(val: number | string): number {
    if (typeof val === 'number') return val;
    const parts = val.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10);
      const secs = parseInt(parts[1], 10);
      return mins * 60 + secs;
    }
    return parseInt(val, 10);
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private handleTimeUpdate(): void {
    const currentTime = this.audioEl.currentTime;
    this.updateLyricByTime(currentTime);
    const current = this.formatTime(currentTime);
    const duration = this.formatTime(this.audioEl.duration || 0);
    this.timeDisplay.textContent = `${current} / ${duration}`;
  }

  private handleMetadataLoaded(): void {
    const duration = this.formatTime(this.audioEl.duration || 0);
    this.timeDisplay.textContent = `00:00 / ${duration}`;
  }

  private updateLyricByTime(time: number): void {
    let idx = this.currentIdx;
    while (idx + 1 < this.timedLyrics.length && time >= this.timedLyrics[idx + 1].start) {
      idx += 1;
    }
    while (idx > 0 && time < this.timedLyrics[idx].start) {
      idx -= 1;
    }
    if (idx !== this.currentIdx) {
      this.currentIdx = idx;
      this.renderLyrics(this.currentIdx);
    }
  }

  private renderLyrics(idx: number): void {
    if (this.lyricsText.children.length === 0) {
      this.timedLyrics.forEach((entry, lineIdx) => {
        const lineEl = document.createElement('div');
        lineEl.className = 'lyrics-line';
        lineEl.textContent = entry.line;
        lineEl.style.cursor = 'pointer';
        lineEl.addEventListener('click', (e: MouseEvent) => {
          e.stopPropagation();
          this.seekToLine(lineIdx);
        });
        this.lyricsText.appendChild(lineEl);
      });
    }

    this.timedLyrics.forEach((_, lineIdx) => {
      const lineEl = this.lyricsText.children[lineIdx];
      const distance = lineIdx - idx;
      this.renderLyricsLine(lineEl, distance);
    });
  }

  private seekToLine(lineIdx: number): void {
    if (lineIdx >= 0 && lineIdx < this.timedLyrics.length) {
      const targetTime = this.timedLyrics[lineIdx].start;
      this.audioEl.currentTime = targetTime;
      this.currentIdx = lineIdx;
      this.renderLyrics(lineIdx);
      console.log(`Seeking to line ${lineIdx + 1}: "${this.timedLyrics[lineIdx].line}" at ${targetTime.toFixed(2)}s`);
    }
  }

  private renderLyricsLine(lineEl: Element, distance: number): void {
    lineEl.classList.remove(
      'lyrics-line--prev',
      'lyrics-line--current',
      'lyrics-line--next',
      'lyrics-line--next-2',
      'lyrics-line--hidden-above',
      'lyrics-line--hidden-below'
    );

    if (distance === -1) {
      lineEl.classList.add('lyrics-line--prev');
    } else if (distance === 0) {
      lineEl.classList.add('lyrics-line--current');
    } else if (distance === 1) {
      lineEl.classList.add('lyrics-line--next');
    } else if (distance === 2) {
      lineEl.classList.add('lyrics-line--next-2');
    } else if (distance > 2) {
      lineEl.classList.add('lyrics-line--hidden-below');
    } else if (distance < -1) {
      lineEl.classList.add('lyrics-line--hidden-above');
    }
  }
}
