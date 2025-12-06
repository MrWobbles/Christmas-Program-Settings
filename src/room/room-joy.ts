import type { LyricsManager } from '../lyrics/LyricsManager';

// Simple twinkling starfield for Room 4
class TwinklingStar {
  x: number;
  y: number;
  size: number;
  twinklePhase: number;
  twinkleSpeed: number;

  constructor(canvas: HTMLCanvasElement) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height * 0.5;
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
    for (let i = 0; i < 50; i++) {
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

class CharacterManager {
  private angel4: HTMLElement | null = null;
  private hostsBack: NodeListOf<HTMLElement>;
  private hostsFront: NodeListOf<HTMLElement>;

  constructor() {
    this.angel4 = document.querySelector('.character--angel4');
    this.hostsBack = document.querySelectorAll('.character--host-back');
    this.hostsFront = document.querySelectorAll('.character--host-front');
  }

  public showCharacters(): void {
    if (this.angel4) this.angel4.classList.add('show');
    this.hostsBack.forEach((host) => host.classList.add('show'));
    this.hostsFront.forEach((host) => host.classList.add('show'));
  }

  public hasCharacters(): boolean {
    return this.angel4 !== null || this.hostsBack.length > 0 || this.hostsFront.length > 0;
  }
}

// Room 4 (Joy to the World) Initialization
export function initRoom4(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  lyricsManager: LyricsManager
): void {
  const characterManager = new CharacterManager();

  // Initialize starfield
  new StarfieldRenderer(canvas, ctx);

  let audioStarted = false;
  let clickCount = 0;

  document.body.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.lyrics-box') || target.closest('.media-bar') || target.closest('.room-switcher')) {
      return;
    }

    clickCount += 1;

    if (clickCount === 1) {
      characterManager.showCharacters();
      return;
    }

    if (clickCount === 2 && !audioStarted) {
      audioStarted = true;
      const audioEl = document.getElementById('carol-audio') as HTMLAudioElement | null;
      if (audioEl) {
        lyricsManager.show();
        audioEl.currentTime = 0;
        audioEl.play().catch(() => undefined);
      }
    } else if (clickCount > 2) {
      const audioEl = document.getElementById('carol-audio') as HTMLAudioElement | null;
      if (audioEl) {
        console.log(`Current time: ${audioEl.currentTime.toFixed(2)}s`);
      }
    }
  });
}
