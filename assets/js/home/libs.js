/**
 * libs.js — single place where the two animation libraries enter the bundle.
 * GSAP: free plugins only (core, ScrollTrigger, Flip, Observer).
 * anime.js: everything discrete — staggers, loops, character work.
 */

import gsap from '/vendor/gsap/gsap.min.js';
import ScrollTrigger from '/vendor/gsap/ScrollTrigger.min.js';
import Flip from '/vendor/gsap/Flip.min.js';
import Observer from '/vendor/gsap/Observer.min.js';
import anime from '/vendor/anime/anime.min.js';

gsap.registerPlugin(ScrollTrigger, Flip, Observer);

export { gsap, ScrollTrigger, Flip, Observer, anime };

/** Shared easing curves — the JS twin of the CSS --ease-* tokens. */
export const EASE = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
};

/**
 * anime.js v3 only accepts a *string* easing name (or a Penner function
 * reference), not an arbitrary function. This maps a CSS cubic-bezier to the
 * closest built-in name so both libraries use the same feel.
 *
 * 0.16, 1, 0.3, 1  ->  "easeOutExpo"   (the classic "expo out" curve)
 * 0.65, 0, 0.35, 1 ->  "easeInOutQuart"
 */
export const ANIME_EASE = {
  out: 'easeOutExpo',
  inOut: 'easeInOutQuart',
};

/** alias kept for readability at call sites */
export const EASE_OUT = ANIME_EASE.out;

/** Penner-style harness for the rare case a real bezier is required. */
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t) => (3 * ax * t + 2 * bx) * t + cx;

  const solve = (x) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = sampleDX(t);
      if (d === 0) break;
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-6) return t;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 20; i++) {
      const v = sampleX(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };

  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sampleY(solve(x)));
}

export const DURATION = {
  fast: 0.16,
  base: 0.32,
  slow: 0.64,
};

