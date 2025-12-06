import type { LyricsManager } from '../lyrics/LyricsManager';

// North Star for Emmanuel room
class NorthStar {
  private x = 0;
  private y = 0;
  private radius = 4;
  private brightness = 0.3;
  private pulsePhase = 0;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.updatePosition();
  }

  private updatePosition(): void {
    this.x = this.canvas.width / 2;
    this.y = this.canvas.height / 2;
  }

  onResize(): void {
    this.updatePosition();
  }

  update(): void {
    this.pulsePhase += 0.002;
    this.brightness = 0.3 + Math.sin(this.pulsePhase) * 0.2;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.filter = 'blur(0.8px)';

    // Inner bright core
    ctx.fillStyle = `rgba(255, 255, 200, ${0.8 + this.brightness})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // First glow layer - warm
    const glow1Radius = this.radius * (8 + this.brightness * 4);
    const glow1Gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glow1Radius);
    glow1Gradient.addColorStop(0, `rgba(255, 255, 150, ${0.7 * this.brightness})`);
    glow1Gradient.addColorStop(0.3, `rgba(255, 200, 100, ${0.4 * this.brightness})`);
    glow1Gradient.addColorStop(0.6, `rgba(255, 150, 50, ${0.15 * this.brightness})`);
    glow1Gradient.addColorStop(1, `rgba(255, 100, 0, 0)`);

    ctx.fillStyle = glow1Gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glow1Radius, 0, Math.PI * 2);
    ctx.fill();

    // Second glow layer - cool blue
    const glow2Radius = this.radius * (12 + this.brightness * 6);
    const glow2Gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glow2Radius);
    glow2Gradient.addColorStop(0, `rgba(200, 220, 255, ${0.4 * this.brightness})`);
    glow2Gradient.addColorStop(0.4, `rgba(150, 180, 255, ${0.2 * this.brightness})`);
    glow2Gradient.addColorStop(1, `rgba(100, 150, 255, 0)`);

    ctx.fillStyle = glow2Gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glow2Radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer atmospheric ring
    const ringRadius = this.radius * (15 + this.brightness * 8);
    const ringGradient = ctx.createRadialGradient(this.x, this.y, ringRadius * 0.8, this.x, this.y, ringRadius);
    ringGradient.addColorStop(0, `rgba(200, 255, 255, ${0.3 * this.brightness})`);
    ringGradient.addColorStop(1, `rgba(200, 255, 255, 0)`);

    ctx.fillStyle = ringGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
    ctx.fill();

    // Dynamic rays
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const rayAngle = (i / rayCount) * Math.PI * 2;
      const rayLength = this.radius * (20 + this.brightness * 10);

      const endX = this.x + Math.cos(rayAngle) * rayLength;
      const endY = this.y + Math.sin(rayAngle) * rayLength;

      const rayGradient = ctx.createLinearGradient(this.x, this.y, endX, endY);
      rayGradient.addColorStop(0, `rgba(255, 255, 200, ${0.6 * this.brightness})`);
      rayGradient.addColorStop(0.5, `rgba(255, 200, 100, ${0.3 * this.brightness})`);
      rayGradient.addColorStop(1, `rgba(255, 150, 50, 0)`);

      ctx.fillStyle = rayGradient;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);

      const rayWidth = 3 + this.brightness * 2;
      const perpAngle = rayAngle + Math.PI / 2;
      ctx.lineTo(
        this.x + Math.cos(rayAngle) * rayLength + Math.cos(perpAngle) * rayWidth,
        this.y + Math.sin(rayAngle) * rayLength + Math.sin(perpAngle) * rayWidth
      );
      ctx.lineTo(
        this.x + Math.cos(rayAngle) * rayLength - Math.cos(perpAngle) * rayWidth,
        this.y + Math.sin(rayAngle) * rayLength - Math.sin(perpAngle) * rayWidth
      );
      ctx.closePath();
      ctx.fill();
    }

    ctx.filter = 'none';
  }
}

class RotatingStar {
  x: number;
  y: number;
  depth: number;
  radius: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: { r: number; g: number; b: number };
  angle: number;
  distance: number;

  constructor(canvas: HTMLCanvasElement) {
    this.depth = Math.random();
    this.x = 0;
    this.y = 0;
    this.radius = Math.pow(this.depth, 1.5) * 1.5;
    this.baseOpacity = Math.pow(this.depth, 0.8) * 0.7 + 0.15;
    this.twinkleSpeed = Math.random() * 0.03 + 0.005;
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.angle = Math.random() * Math.PI * 2;
    this.distance = Math.random() * 300 + 100;

    const colorTypes = [
      { r: 255, g: 255, b: 200 },
      { r: 255, g: 220, b: 150 },
      { r: 200, g: 220, b: 255 },
      { r: 255, g: 240, b: 200 },
    ];
    this.color = colorTypes[Math.floor(Math.random() * colorTypes.length)];
  }

  update(rotationAngle: number, canvas: HTMLCanvasElement): void {
    this.twinklePhase += this.twinkleSpeed;
    const currentAngle = this.angle + rotationAngle;
    this.x = canvas.width / 2 + Math.cos(currentAngle) * this.distance;
    this.y = canvas.height / 2 + Math.sin(currentAngle) * this.distance;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const brightness = Math.sin(this.twinklePhase) * (this.baseOpacity * 0.5) + this.baseOpacity;
    const { r, g, b } = this.color;

    const glowRadius = this.radius * (3 + brightness * 2);
    const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
    glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness * 0.4})`);
    glowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${brightness * 0.15})`);
    glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${brightness})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

class NorthStarfieldRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rotatingStars: RotatingStar[] = [];
  private northStar: NorthStar;
  private animationTime = 0;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.northStar = new NorthStar(canvas);
    this.initStars();
    this.animate();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.northStar.onResize();
  }

  private initStars(): void {
    this.resizeCanvas();
    for (let i = 0; i < 120; i++) {
      this.rotatingStars.push(new RotatingStar(this.canvas));
    }
  }

  private animate = (): void => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Much slower rotation - 0.00001 instead of 0.0001
    const rotationAngle = (this.animationTime * 0.00001) % (Math.PI * 2);

    this.rotatingStars.forEach((star) => {
      star.update(rotationAngle, this.canvas);
      star.draw(this.ctx);
    });

    this.northStar.update();
    this.northStar.draw(this.ctx);

    const outerGlow = this.ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      0,
      this.canvas.width / 2,
      this.canvas.height / 2,
      500
    );
    outerGlow.addColorStop(0, 'rgba(200, 200, 255, 0.05)');
    outerGlow.addColorStop(1, 'rgba(200, 200, 255, 0)');
    this.ctx.fillStyle = outerGlow;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.animationTime += 1;
    requestAnimationFrame(this.animate);
  };
}

// Room 1 (Emmanuel) Initialization
export function initRoom1(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, lyricsManager: LyricsManager): void {
  // Initialize North Star with rotating stars
  new NorthStarfieldRenderer(canvas, ctx);

  let audioStarted = false;

  // Add click handler to the document body to ensure it captures clicks
  document.body.addEventListener('click', (e: MouseEvent) => {
    // Skip if clicking on UI elements
    const target = e.target as HTMLElement;
    if (target.closest('.lyrics-box') || target.closest('.media-bar') || target.closest('.room-switcher')) {
      return;
    }

    if (!audioStarted) {
      audioStarted = true;
      console.log('Starting audio and showing lyrics');
      
      const audioEl = document.getElementById('carol-audio') as HTMLAudioElement | null;
      if (audioEl) {
        // Show lyrics
        lyricsManager.show();
        
        // Start audio from beginning
        audioEl.currentTime = 0;
        audioEl.play().catch((err) => console.error('Audio play error:', err));
        
        const currentTime = audioEl.currentTime;
        console.log(`Current time: ${currentTime.toFixed(2)}s`);
      }
    }
  });
}
