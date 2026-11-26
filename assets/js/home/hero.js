/**
 * hero.js — kinetic typography, rotating tagline, magnetic CTA, ambient canvas.
 * anime.js does every discrete animation. GSAP quickTo does pointer work only.
 */

import { gsap, anime } from './libs.js';
import { EASE_OUT } from './libs.js';
import { state, onIntroDone } from './state.js';

export function initHero({ reduced, fine }) {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const lines = hero.querySelectorAll('[data-hero-line]');
  const fades = hero.querySelectorAll('[data-hero-fade]');
  const tagline = hero.querySelector('[data-hero-tagline]');
  const canvas = hero.querySelector('[data-hero-canvas]');

  if (reduced) {
    gsap.set([...lines, ...fades], { clearProps: 'all' });
    return;
  }

  /* --- 1. line masks ------------------------------------------------- */
  /* One library owns `transform` per element. anime.js drives the reveal,
     so GSAP must not also write yPercent here (they would stack and the
     mask would never open). */
  lines.forEach((l) => {
    l.style.transform = 'translateY(110%)';
  });
  fades.forEach((f) => {
    f.style.opacity = '0';
    f.style.transform = 'translateY(16px)';
  });

  const playIntro = () => {
    anime({
      targets: lines,
      translateY: ['110%', '0%'],
      duration: 1100,
      delay: anime.stagger(90, { start: 60 }),
      easing: EASE_OUT,
      complete: () => {
        lines.forEach((l) => {
          l.style.transform = '';
        });
      },
    });

    anime({
      targets: fades,
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 800,
      delay: anime.stagger(80, { start: 620 }),
      easing: EASE_OUT,
      complete: () => {
        fades.forEach((f) => {
          f.style.transform = '';
          f.style.opacity = '';
        });
      },
    });
  };

  /* Wait for the preloader if it is actually going to play. */
  onIntroDone(playIntro);

  /* --- 2. rotating tagline ------------------------------------------- */
  if (tagline) {
    const words = [...tagline.querySelectorAll('.hero__tagline-item')];
    if (words.length > 1) {
      words.forEach((w, i) => {
        if (i > 0) w.classList.remove('u-sr-only');
        w.style.opacity = i === 0 ? 1 : 0;
      });

      anime({
        targets: words,
        keyframes: [
          { opacity: [0, 1], translateY: [14, 0], duration: 420 },
          { opacity: 1, duration: 1600 },
          { opacity: [1, 0], translateY: [0, -14], duration: 320 },
        ],
        delay: anime.stagger(2600),
        loop: true,
        easing: 'easeOutQuad',
      });
    }
  }

  /* --- 3. magnetic CTA ------------------------------------------------ */
  if (fine) {
    hero.querySelectorAll('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });

      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.28);
      });

      el.addEventListener('pointerleave', () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* --- 4. ambient canvas --------------------------------------------- */
  if (canvas) initCanvas(canvas, { reduced });
}

/** Drifting dots. Paused when off-screen. DPR capped at 1.5. */
function initCanvas(canvas, { reduced }) {
  if (reduced) return;

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let raf = 0;
  let visible = true;
  let dots = [];

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(70, Math.round((width * height) / 22000));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.14,
      vy: (Math.random() - 0.5) * 0.14,
    }));
    draw();
  };

  const draw = () => {
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);

    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent')
      .trim() || '#4f46e5';

    ctx.fillStyle = accent;

    for (const d of dots) {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0 || d.x > width) d.vx *= -1;
      if (d.y < 0 || d.y > height) d.vy *= -1;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const loop = () => {
    if (visible) {
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
      }
      draw();
    }
    raf = requestAnimationFrame(loop);
  };

  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0 }
  ).observe(canvas);

  window.addEventListener('resize', resize, { passive: true });
  resize();
  raf = requestAnimationFrame(loop);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(loop);
  });
}
