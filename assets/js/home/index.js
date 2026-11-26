/**
 * index.js — the only entry point.
 *
 * Import every module before markIntroDone, otherwise a late subscriber
 * misses `home:introdone` and the hero reveal never starts.
 *
 * Rule of the house: anime.js animates, GSAP orchestrates scroll + pointer.
 */

import { ScrollTrigger } from './libs.js';
import { markIntroDone } from './state.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* One definition of "can hover", used by every module. Keeping a single
   query avoids modules disagreeing about the same capability. */
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const has = (sel) => Boolean(document.querySelector(sel));

const boot = async () => {
  const loaders = [];
  const inits = [];

  /* 1. import every module the DOM needs — in parallel, no awaiting yet */
  if (has('.hero')) {
    loaders.push(import('./hero.js').then((m) => ['hero', m.initHero]));
  }
  if (has('[data-marquee-row]')) {
    loaders.push(import('./marquee.js').then((m) => ['marquee', m.initMarquee]));
  }
  if (has('[data-gallery-track]')) {
    loaders.push(import('./gallery.js').then((m) => ['gallery', m.initGallery]));
  }
  if (has('[data-outro-lead]')) {
    loaders.push(import('./outro.js').then((m) => ['outro', m.initOutro]));
  }
  if (has('[data-cursor-root]')) {
    loaders.push(import('./cursor.js').then((m) => ['cursor', m.initCursor]));
  }
  /* nav + palette are site-wide: they boot from assets/js/nav/boot.js on every
     page, including this one, so they must not also be loaded here. */

  const modules = new Map(await Promise.all(loaders));

  for (const [, fn] of modules) {
    inits.push(fn({ reduced, fine }));
  }

  /* The hero reveal waits on this. There is no loading screen anymore. */
  markIntroDone();

  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return Promise.all(inits);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
