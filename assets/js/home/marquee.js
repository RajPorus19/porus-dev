/**
 * marquee.js — endless ticker.
 *
 * Each row holds two identical tracks laid out flush. Both are animated as one
 * group: when the group has travelled exactly one track width the frame is
 * pixel-identical to the start, so the loop has no seam and no empty gap.
 *
 * anime.js owns the transform on the tracks. Scroll velocity (ScrollTrigger)
 * only changes `instance.speed` and writes a skew on the *row wrapper*, so it
 * can never clobber the translate and knock the rows out of alignment.
 */

import { ScrollTrigger, anime } from './libs.js';

export function initMarquee({ reduced }) {
  const rows = document.querySelectorAll('[data-marquee-row]');
  if (!rows.length) return;

  rows.forEach((row) => {
    /* Query by class, not [data-marquee-track]: the clone only carries
       data-marquee-clone, so an attribute query returned one node and the
       clone track never moved — half the row stayed empty. */
    const tracks = [...row.querySelectorAll('.marquee__track')];
    if (!tracks.length) return;

    const reverse = row.hasAttribute('data-marquee-reverse');
    let instance = null;

    const build = () => {
      const width = tracks[0].getBoundingClientRect().width;
      if (!width) return;

      if (instance) instance.pause();
      tracks.forEach((t) => {
        t.style.transform = '';
      });

      instance = anime({
        targets: tracks,
        /* Both rows start one full track-width to the left of the viewport and
           travel to 0. Row 1 plays forward (moving left visually, wrapping from
           the right); row 2 plays in reverse (moving right visually). Starting
           anywhere else leaves an uncovered edge on one side. */
        translateX: [-width, 0],
        duration: Math.round((width / 60) * 1000),
        easing: 'linear',
        loop: true,
        autoplay: !reduced,
        direction: reverse ? 'reverse' : 'normal',
      });
    };

    build();

    /* Fonts change glyph widths, which changes the loop distance. Rebuild once
       with the real metrics so the seam never shows. */
    document.fonts?.ready.then(build);

    if (reduced) return;

    ScrollTrigger.create({
      trigger: row,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        if (!instance) return;
        const v = Math.min(Math.abs(self.getVelocity()) / 1200, 3);
        instance.speed = 1 + v * 1.6;

        /* skew on the wrapper — never on the tracks anime.js owns */
        const dir = reverse ? -1 : 1;
        row.style.transform = `skewX(${Math.min(v * 3, 6) * dir}deg)`;
      },
    });
  });
}
