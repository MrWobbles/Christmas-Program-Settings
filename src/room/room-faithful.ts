import type { LyricsManager } from '../lyrics/LyricsManager';

// Simple twinkling starfield for Room 3
class TwinklingStar {
  x: number;
  y: number;
  size: number;
  twinklePhase: number;
  twinkleSpeed: number;

  constructor(canvas: HTMLCanvasElement) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height * 0.4; // Upper 40% of canvas
    this.size = 1 + Math.random() * 2;
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = 0.015 + Math.random() * 0.025;
  }

  update(): void {
    this.twinklePhase += this.twinkleSpeed;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const brightness = Math.sin(this.twinklePhase) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Subtle glow
    const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
    glowGradient.addColorStop(0, `rgba(255, 255, 255, ${brightness * 0.3})`);
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

class StarfieldRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stars: TwinklingStar[] = [];

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.initStars();
    this.animate();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private initStars(): void {
    this.resizeCanvas();
    for (let i = 0; i < 40; i++) {
      this.stars.push(new TwinklingStar(this.canvas));
    }
  }

  private animate = (): void => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.stars.forEach((star) => {
      star.update();
      star.draw(this.ctx);
    });
    requestAnimationFrame(this.animate);
  };
}

// Room 3 (O Come All Ye Faithful) Initialization
export function initRoom3(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  lyricsManager: LyricsManager
): void {
  // Initialize starfield
  new StarfieldRenderer(canvas, ctx);

  let currentVerseIndex = 0;
  let clickCount = 0;

  // Multi-click interaction for visual elements
  document.body.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.lyrics-box') || target.closest('.media-bar') || target.closest('.room-switcher')) {
      return;
    }

    clickCount += 1;

    if (clickCount === 1) {
      // First click: show donkey image
      const donkey = document.querySelector('.character--donkey') as HTMLElement | null;
      if (donkey) {
        donkey.classList.add('show');
      }
      return;
    }

    // Audio playback is now managed by the sync manager in main.ts
  });
}
