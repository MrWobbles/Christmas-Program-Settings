import type { LyricsManager } from '../lyrics/LyricsManager';

// Gentle falling snow for Room 5 (Silent Night)
class Snowflake {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;

  constructor(canvas: HTMLCanvasElement) {
    this.x = Math.random() * canvas.width;
    this.y = -10;
    this.size = 2 + Math.random() * 4;
    this.speedY = 1 + Math.random() * 2;
    this.speedX = (Math.random() - 0.5) * 1;
    this.opacity = 0.3 + Math.random() * 0.7;
  }

  update(canvas: HTMLCanvasElement): void {
    this.y += this.speedY;
    this.x += this.speedX;

    // Wrap around screen
    if (this.y > canvas.height) {
      this.y = -10;
      this.x = Math.random() * canvas.width;
    }
    if (this.x > canvas.width) {
      this.x = 0;
    }
    if (this.x < 0) {
      this.x = canvas.width;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function initRoom5(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  lyricsManager: LyricsManager
): void {
  // Create snowflakes
  const snowflakes: Snowflake[] = [];
  for (let i = 0; i < 50; i++) {
    snowflakes.push(new Snowflake(canvas));
  }

  // Handle window resize
  function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // Initial setup
  handleResize();
  window.addEventListener('resize', handleResize);

  // Animation loop
  let animationId: number;

  function animate() {
    ctx.fillStyle = 'rgba(20, 20, 40, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw snowflakes
    for (const snowflake of snowflakes) {
      snowflake.update(canvas);
      snowflake.draw(ctx);
    }

    animationId = requestAnimationFrame(animate);
  }

  animate();

  // Cleanup function (optional, for when page unloads)
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationId);
  });
}
