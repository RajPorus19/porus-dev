/**
 * preloader.js — the signature moment.
 * anime.js: counter + bar. GSAP Flip: dock the wordmark into the navbar brand.
 * Budget: <= 1.6s. Plays once per session. Never traps content.
 */

import { gsap, anime, Flip } from './libs.js';
import { markIntroDone } from './state.js';

const SESSION_KEY = 'hp_intro';
const HARD_TIMEOUT = 2500;

export function initPreloader({ reduced }) {
  const root = document.querySelector('[data-preloader]');
  if (!root) return Promise.resolve();

  const seen = sessionStorage.getItem(SESSION_KEY) === '1';

  /* Reduced motion or returning visitor: nothing to play. */
  if (reduced || seen) {
    root.classList.add('is-idle', 'is-done');
    sessionStorage.setItem(SESSION_KEY, '1');
    markIntroDone();
    return Promise.resolve();
  }

  const count = root.querySelector('[data-preloader-count]');
  const bar = root.querySelector('[data-preloader-bar]');
  const mark = root.querySelector('[data-preloader-mark]');
  const panels = root.querySelectorAll('[data-preloader-panel]');

  root.classList.remove('is-idle');
  root.classList.add('is-live');
  document.documentElement.classList.add('has-preloader');

  return new Promise((resolve) => {
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      root.classList.add('is-done');
      root.classList.add('is-idle');
      document.documentElement.classList.remove('has-preloader');
      sessionStorage.setItem(SESSION_KEY, '1');
      resolve();
      markIntroDone();
    };

    /* Safety net: a broken timeline must never block the page. */
    const safety = setTimeout(finish, HARD_TIMEOUT);

    const counter = { v: 0 };

    anime({
      targets: counter,
      v: 100,
      duration: 900,
      easing: 'easeInOutQuart',
      update: () => {
        count.textContent = String(Math.round(counter.v)).padStart(3, '0');
      },
      complete: () => {
        /* 1. dock the wordmark into the navbar brand slot (real FLIP) */
        const brand = document.querySelector('.navbar-brand');
        const flipState = brand && mark ? Flip.getState(mark) : null;

        if (flipState && brand) {
          const rect = brand.getBoundingClientRect();
          mark.style.position = 'fixed';
          mark.style.left = `${rect.left}px`;
          mark.style.top = `${rect.top}px`;
          mark.style.fontSize = '30px';
          mark.style.transform = 'none';

          Flip.from(flipState, {
            duration: 0.6,
            ease: 'power2.inOut',
            absolute: false,
          });
        }

        /* 2. split the overlay open */
        anime({
          targets: panels,
          translateY: (el, i) => (i === 0 ? '-100%' : '100%'),
          duration: 800,
          delay: 120,
          easing: 'easeInOutExpo',
        });

        anime({
          targets: [count, bar],
          opacity: 0,
          duration: 260,
          easing: 'linear',
        });

        anime({
          targets: mark,
          opacity: 0,
          duration: 220,
          delay: 420,
          easing: 'linear',
          complete: () => {
            clearTimeout(safety);
            finish();
          },
        });
      },
    });

    anime({
      targets: bar,
      scaleX: [0, 1],
      duration: 900,
      easing: 'easeInOutQuart',
    });
  });
}
