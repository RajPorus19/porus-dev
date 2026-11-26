/**
 * gallery.js — pinned horizontal project track on desktop, plain stack on mobile.
 * ScrollTrigger owns pinning + scrub; anime.js handles card entrance.
 */

import { gsap, ScrollTrigger, anime } from './libs.js';
import { revealBatch } from './reveal.js';

export function initGallery({ reduced, fine }) {
  const gallery = document.querySelector('.gallery');
  if (gallery && fine && !reduced) initGalleryGlow(gallery);

  const track = document.querySelector('[data-gallery-track]');
  if (!track) return;

  const cards = track.querySelectorAll('[data-gallery-card]');
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

  });

  /* --- mobile: normal vertical reveal -------------------------------- */
  mm.add('(max-width: 1023px)', () => {
    if (reduced) return;
    revealBatch(cards, { y: 24, stagger: 90 });
  });
}

/** Same pointer wash as the hero. --mx / --my stay on the gallery, not the hero. */
function initGalleryGlow(gallery) {
  const glow = gallery.querySelector('[data-gallery-glow]');
  if (!glow) return;

  let raf = 0;
  let mx = 50;
  let my = 45;

  const write = () => {
    raf = 0;
    gallery.style.setProperty('--mx', mx.toFixed(2) + '%');
    gallery.style.setProperty('--my', my.toFixed(2) + '%');
  };

  gallery.addEventListener('pointermove', (e) => {
    const r = gallery.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width) * 100;
    my = ((e.clientY - r.top) / r.height) * 100;
    if (!raf) raf = requestAnimationFrame(write);
  });

  gallery.addEventListener('pointerleave', () => {
    mx = 50;
    my = 45;
    if (!raf) raf = requestAnimationFrame(write);
  });
}
