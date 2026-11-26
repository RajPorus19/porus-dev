/**
 * outro.js — per-character reveal + magnetic mail link.
 */

import { gsap, anime } from './libs.js';
import { EASE_OUT } from './libs.js';
import { splitChars } from './split.js';
import { ScrollTrigger } from './libs.js';

export function initOutro({ reduced, fine }) {
  const lead = document.querySelector('[data-outro-lead]');
  if (!lead || reduced) return;

  const chars = splitChars(lead);
  gsap.set(chars, { opacity: 0 });

  ScrollTrigger.create({
    trigger: lead,
    start: 'top bottom-=15%',
    once: true,
    onEnter: () => {
      anime({
        targets: chars,
        opacity: [0, 1],
        translateY: [22, 0],
        rotate: [6, 0],
        duration: 820,
        delay: anime.stagger(16),
        easing: EASE_OUT,
      });
    },
  });

  if (fine) {
    document.querySelectorAll('.outro__mail[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.14);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener('pointerleave', () => {
        xTo(0);
        yTo(0);
      });
    });
  }
}
