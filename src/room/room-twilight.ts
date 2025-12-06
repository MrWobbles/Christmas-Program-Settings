import type { LyricsManager } from '../lyrics/LyricsManager';

type Point = { x: number; y: number };

class TwinklingStar {
  x: number;
  y: number;
  size: number;
  twinklePhase: number;
  twinkleSpeed: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.size = 1.5 + Math.random() * 1.5;
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = 0.02 + Math.random() * 0.03;
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
    glowGradient.addColorStop(0, `rgba(255, 255, 255, ${(brightness - 0.5) * 0.3})`);
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class StarfieldRenderer {
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
    for (let i = 0; i < 25; i += 1) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * (this.canvas.height * 0.5);
      this.stars.push(new TwinklingStar(x, y));
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

export class DragManager {
  private dragTarget: HTMLElement | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  constructor(draggableElements: HTMLElement[]) {
    draggableElements.forEach((el) => {
      el.addEventListener('mousedown', (e) => this.startDrag(e, el));
      el.addEventListener('touchstart', (e) => this.startDrag(e, el));
    });
  }

  private getPoint(e: MouseEvent | TouchEvent): Point {
    if ('touches' in e && e.touches.length) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    const mouseEvent = e as MouseEvent;
    return { x: mouseEvent.clientX, y: mouseEvent.clientY };
  }

  private startDrag(e: MouseEvent | TouchEvent, el: HTMLElement): void {
    const point = this.getPoint(e);
    this.dragTarget = el;
    const rect = el.getBoundingClientRect();
    this.dragOffsetX = point.x - rect.left;
    this.dragOffsetY = point.y - rect.top;
    el.style.transition = 'none';
    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('touchmove', this.onDragMove, { passive: false });
    document.addEventListener('mouseup', this.endDrag);
    document.addEventListener('touchend', this.endDrag);
  }

  private onDragMove = (e: MouseEvent | TouchEvent): void => {
    if (!this.dragTarget) return;
    const point = this.getPoint(e);
    this.dragTarget.style.left = `${point.x - this.dragOffsetX}px`;
    this.dragTarget.style.top = `${point.y - this.dragOffsetY}px`;
    if ('preventDefault' in e) e.preventDefault();
  };

  private endDrag = (): void => {
    if (this.dragTarget) {
      this.dragTarget.style.transition = '';
    }
    this.dragTarget = null;
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('touchmove', this.onDragMove as EventListener);
    document.removeEventListener('mouseup', this.endDrag);
    document.removeEventListener('touchend', this.endDrag);
  };
}

export class CharacterManager {
  private gabriel: HTMLElement | null = null;
  private hosts: NodeListOf<HTMLElement>;
  private clickCount = 0;

  constructor() {
    this.gabriel = document.querySelector('.character--gabriel');
    this.hosts = document.querySelectorAll('.character--host');
  }

  public showCharacters(): void {
    if (this.gabriel) this.gabriel.classList.add('show');
    this.hosts.forEach((host) => host.classList.add('show'));
  }

  public hasCharacters(): boolean {
    return this.gabriel !== null || this.hosts.length > 0;
  }

  public getCharacters(): HTMLElement[] {
    const characters: HTMLElement[] = [];
    if (this.gabriel) characters.push(this.gabriel);
    characters.push(...Array.from(this.hosts));
    return characters;
  }
}

// Room 2 (Twilight) Initialization
export function initRoom2(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, lyricsManager: LyricsManager): void {
  const characterManager = new CharacterManager();

  // Initialize starfield
  new StarfieldRenderer(canvas, ctx);

  // Initialize drag manager for characters
  if (characterManager.hasCharacters()) {
    new DragManager(characterManager.getCharacters());
  }

  let audioStarted = false;
  let clickCount = 0;

  document.body.addEventListener('click', (e: MouseEvent) => {
    // Skip if clicking on UI elements
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
        audioEl.currentTime = 4;
        audioEl.play().catch(() => undefined);
      }
    }
  });
}