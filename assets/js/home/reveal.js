/**
 * reveal.js — one shared scroll-in helper.
 *
 * Uses a native IntersectionObserver rather than ScrollTrigger for reveals:
 * ScrollTrigger triggers measured against elements that are already hidden
 * (opacity 0 + translated) can fail to fire, especially on mobile after a
 * refresh. IntersectionObserver has no measurement dependency.
 *
 * ScrollTrigger is still used for scrub/pin in gallery.js and marquee.js.
 */

import { anime } from './libs.js';
import { EASE_OUT } from './libs.js';

const DEFAULTS = {
  y: 28,
  duration: 900,
  delay: 0,
  stagger: 70,
  threshold: 0.15,
};

const hide = (el) => {
  el.style.opacity = '0';
  el.style.transform = `translateY(${DEFAULTS.y}px)`;
};

const show = (targets, o) => {
  anime({
    targets,
    opacity: [0, 1],
    translateY: [o.y, 0],
    duration: o.duration,
    delay: anime.stagger(o.stagger, { start: o.delay }),
    easing: EASE_OUT,
    complete: () => {
      targets.forEach((t) => {
        t.style.transform = '';
        t.style.opacity = '';
      });
    },
  });
};

/**
 * Observe a group; reveal the whole group the first time any of it is seen.
 * @param {Element[]|NodeList} targets
 * @param {object} opts
 */
export function revealBatch(targets, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const list = [...targets].filter(Boolean);
  if (!list.length) return;

  list.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = `translateY(${o.y}px)`;
  });

  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      show(list, o);
    },
    { threshold: o.threshold, rootMargin: '0px 0px -8% 0px' }
  );

  list.forEach((el) => io.observe(el));

  /* Safety: anything still hidden after 4s gets revealed regardless. */
  setTimeout(() => {
    io.disconnect();
    if (list[0]?.style.opacity === '0') show(list, o);
  }, 4000);
}

/** Single-element convenience wrapper. */
export function revealOnScroll(targets, opts = {}) {
  const list = [...(targets.length ? targets : [targets])].filter(Boolean);
  revealBatch(list, opts);
}
