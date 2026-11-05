// Sistema de partículas e confetes cyber (bits 0 e 1, faíscas neon e glifos) em Canvas 2D.
// Leve, sem dependências, com limpeza automática e respeito ao modo calmo/acessibilidade.

export function cyberConfetti({ count = 50, x, y } = {}) {
  if (typeof document === 'undefined') return;
  if (document.documentElement.classList.contains('calm')) return;

  const w = window.innerWidth, h = window.innerHeight;
  const originX = x ?? w / 2;
  const originY = y ?? (h * 0.4);

  let canvas = document.getElementById('fxCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'fxCanvas';
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const colors = ['#00e0a8', '#4dd2ff', '#ffe8a3', '#ff2e63', '#a78bfa', '#ffffff'];
  const glifs = ['0', '1', '#', '<', '>', '*', 'NOC', '⚡'];

  const particles = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 12 + 4;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 8,
      char: Math.random() > 0.35 ? glifs[Math.floor(Math.random() * glifs.length)] : null,
      alpha: 1,
      decay: Math.random() * 0.016 + 0.012
    };
  });

  let rafId;
  const step = () => {
    ctx.clearRect(0, 0, w, h);
    let alive = 0;

    for (const p of particles) {
      if (p.alpha <= 0) continue;
      alive++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.38; // gravidade
      p.vx *= 0.98; // atrito do ar
      p.rot += p.vrot;
      p.alpha = Math.max(0, p.alpha - p.decay);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.char) {
        ctx.font = `bold ${Math.round(p.size)}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, 0, 0);
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      }
      ctx.restore();
    }

    if (alive > 0) {
      rafId = requestAnimationFrame(step);
    } else {
      ctx.clearRect(0, 0, w, h);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };

  rafId = requestAnimationFrame(step);
  return () => {
    cancelAnimationFrame(rafId);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
