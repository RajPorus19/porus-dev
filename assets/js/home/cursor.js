/**
 * cursor.js — dot + lagging ring, difference blend, grows over interactive
 * elements. Desktop pointer only.
 */

import { gsap } from './libs.js';

export function initCursor({ reduced, fine }) {
  if (reduced || !fine) return;

  const root = document.querySelector('[data-cursor-root]');
  if (!root) return;

  const dot = root.querySelector('.cursor__dot');
  const ring = root.querySelector('.cursor__ring');
  if (!dot || !ring) return;

  document.documentElement.classList.add('has-cursor');
  gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

  const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });

  let shown = false;

  window.addEventListener(
    'pointermove',
    (e) => {
      if (!shown) {
        shown = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    },
    { passive: true }
  );

  document.addEventListener('pointerover', (e) => {
    const hit = e.target.closest('a, button, [data-cursor="link"]');
    gsap.to(ring, {
      scale: hit ? 2.4 : 1,
      opacity: hit ? 0.55 : 0.9,
      duration: 0.35,
      ease: 'power3.out',
    });
  });

  document.addEventListener('pointerleave', () => {
    gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
    shown = false;
  });
}
