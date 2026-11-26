/**
 * outro.js — per-character reveal + magnetic mail link.
 */

import { gsap, anime } from './libs.js';
import { EASE_OUT } from './libs.js';
import { splitChars } from './split.js';
import { ScrollTrigger } from './libs.js';

export function initOutro({ reduced, fine }) {
  initEarthrise(reduced);

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

/**
 * The earthrise scene is 200×100 and animated. It stays out of the DOM until
 * the contact section actually enters, then fades in with the scroll.
 * --earth (0 → 1) only recolors the type so it stays readable on the scene.
 * Called from initOutro, which index.js runs for [data-outro-lead].
 */
function initEarthrise(reduced) {
  const outro = document.querySelector('.outro');
  const bg = outro?.querySelector('[data-outro-bg]');
  if (!outro || !bg) return;

  let mounted = false;
  const mount = () => {
    if (mounted) return;
    mounted = true;
    const art = document.createElement('ascii-art');
    art.setAttribute('piece', 'earthrise');
    bg.appendChild(art);
  };

  const paint = (amount) => {
    bg.style.opacity = String(amount);
    outro.style.setProperty('--earth', String(amount));
  };

  if (reduced) {
    mount();
    paint(1);
    return;
  }

  const apply = (progress) => {
    const t = 1 - (1 - progress) * (1 - progress);
    if (progress > 0) mount();
    paint(Math.round(t * 1000) / 1000);
  };

  const trigger = ScrollTrigger.create({
    trigger: outro,
    start: 'top bottom',
    end: 'top 40%',
    onUpdate: (self) => apply(self.progress),
  });

  apply(trigger.progress);
}
