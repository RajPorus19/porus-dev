/**
 * index.js — the only entry point.
 *
 * Load order matters: every module must be imported *before* the preloader
 * resolves, otherwise late subscribers miss the `home:introdone` event.
 * So: import everything first (parallel), then start the preloader.
 *
 * Rule of the house: anime.js animates, GSAP orchestrates scroll + pointer.
 */

import { ScrollTrigger } from './libs.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(pointer: fine)').matches;

const has = (sel) => Boolean(document.querySelector(sel));

const boot = async () => {
  const loaders = [];
  const inits = [];

  /* 1. import every module the DOM needs — in parallel, no awaiting yet */
  if (has('[data-preloader]')) {
    loaders.push(import('./preloader.js').then((m) => ['preloader', m.initPreloader]));
  }
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

  const modules = new Map(await Promise.all(loaders));

  /* 2. start everything except the preloader, so their listeners exist */
  for (const [name, fn] of modules) {
    if (name === 'preloader') continue;
    inits.push(fn({ reduced, fine }));
  }

  /* 3. preloader last: it dispatches home:introdone */
  const preloader = modules.get('preloader');
  if (preloader) inits.push(preloader({ reduced, fine }));

  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return Promise.all(inits);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
