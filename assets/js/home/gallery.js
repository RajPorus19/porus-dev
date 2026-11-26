/**
 * gallery.js — pinned horizontal project track on desktop, plain stack on mobile.
 * ScrollTrigger owns pinning + scrub; anime.js handles card entrance.
 */

import { gsap, ScrollTrigger, anime } from './libs.js';
import { revealBatch } from './reveal.js';

export function initGallery({ reduced }) {
  const track = document.querySelector('[data-gallery-track]');
  if (!track) return;

  const cards = track.querySelectorAll('[data-gallery-card]');
  const progress = document.querySelector('[data-gallery-progress]');
  if (!cards.length) return;

  const mm = gsap.matchMedia();

  /* --- desktop: pin + horizontal scrub ------------------------------- */
  mm.add('(min-width: 1024px)', () => {
    if (reduced) return;

    const distance = () => track.scrollWidth - window.innerWidth;

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.gallery',
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          if (progress) gsap.set(progress, { scaleX: self.progress });
        },
      },
    });

    /* inner image parallax against the track movement */
    cards.forEach((card) => {
      const img = card.querySelector('[data-card-img]');
      if (!img) return;
      gsap.fromTo(
        img,
        { xPercent: -6 },
        {
          xPercent: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            containerAnimation: tween,
            start: 'left right',
            end: 'right left',
            scrub: true,
          },
        }
      );
    });

    return () => progress && gsap.set(progress, { scaleX: 0 });
  });

  /* --- mobile: normal vertical reveal -------------------------------- */
  mm.add('(max-width: 1023px)', () => {
    if (reduced) return;
    revealBatch(cards, { y: 24, stagger: 90 });
  });
}
