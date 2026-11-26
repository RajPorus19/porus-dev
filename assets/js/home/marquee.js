/**
 * marquee.js — base motion in anime.js, speed/skew driven by scroll velocity
 * (ScrollTrigger, free plugin).
 */

import { ScrollTrigger, anime } from './libs.js';

export function initMarquee({ reduced }) {
  const rows = document.querySelectorAll('[data-marquee-row]');
  if (!rows.length) return;

  rows.forEach((row) => {
    const track = row.querySelector('[data-marquee-track]');
    if (!track) return;

    const reverse = row.hasAttribute('data-marquee-reverse');
    const width = track.getBoundingClientRect().width;
    if (!width) return;

    /* The loop has to travel exactly one track width for a seamless wrap. */
    const instance = anime({
      targets: track,
      translateX: reverse ? [0, width] : [-width, 0],
      duration: Math.round(width * 12),
      easing: 'linear',
      loop: true,
      autoplay: !reduced,
    });

    if (reduced) return;

    let last = ScrollTrigger.getVelocity ? 0 : 0;

    ScrollTrigger.create({
      trigger: row,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const v = Math.min(Math.abs(self.getVelocity()) / 1200, 3);
        const dir = reverse ? -1 : 1;

        /* speed up with velocity, settle back to 1 */
        instance.speed = 1 + v * 1.6;

        const skew = Math.min(v * 3, 6) * dir;
        track.style.transform = `${track.style.transform.split(' skew')[0]} skewX(${skew}deg)`;
      },
    });
  });

  /* Recompute loop distances after the fonts land, otherwise the seam shows. */
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
