/**
 * cursor.js — dot + lagging ring, difference blend, grows over interactive
 * elements.
 *
 * Desktop pointer only. Nothing renders until a real mouse `pointermove`
 * arrives, so the ring can never be parked at (0,0) as a stray circle in the
 * top-left corner — that used to show up on top of the logo, most visibly on
 * touch devices where `pointerover` fires with no preceding move.
 */

import { gsap } from './libs.js';

export function initCursor({ reduced, fine }) {
  if (reduced || !fine) return;

  const root = document.querySelector('[data-cursor-root]');
  if (!root) return;

  const dot = root.querySelector('.cursor__dot');
  const ring = root.querySelector('.cursor__ring');
  if (!dot || !ring) return;

  /* Take over the pointer only on a device that actually has a hovering one.
     `fine` from index.js already encodes `(hover: hover) and (pointer: fine)`,
     so the extra matchMedia check is redundant and could disagree with it. */

  gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.6 });

  /* quickTo must be created *after* the initial set, otherwise it caches the
     zero position and never animates away from the corner. */
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });

  let armed = false;

  const arm = (e) => {
    armed = true;
    /* jump straight to the pointer — no swoop in from the corner */
    dotX(e.clientX);
    dotY(e.clientY);
    ringX(e.clientX);
    ringY(e.clientY);
    document.documentElement.classList.add('has-cursor');
    gsap.to(dot, { opacity: 1, scale: 1, duration: 0.25 });
    gsap.to(ring, { opacity: 0.9, scale: 1, duration: 0.25 });
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!armed) arm(e);
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    },
    { passive: true }
  );

  document.addEventListener('pointerover', (e) => {
    if (!armed || e.pointerType !== 'mouse') return;
    const hit = e.target.closest('a, button, [data-cursor]');
    gsap.to(ring, {
      scale: hit ? 2.4 : 1,
      opacity: hit ? 0.55 : 0.9,
      duration: 0.35,
      ease: 'power3.out',
    });
  });

  /* pointer leaves the window: hide, and re-arm on the next entry */
  document.addEventListener('pointerleave', () => {
    if (!armed) return;
    armed = false;
    document.documentElement.classList.remove('has-cursor');
    gsap.to([dot, ring], { opacity: 0, scale: 0.6, duration: 0.2 });
  });
}
