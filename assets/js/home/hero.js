/**
 * hero.js — kinetic typography, rotating tagline, magnetic CTA, photo recession.
 *
 * anime.js drives every discrete animation. GSAP quickTo is used only for
 * pointer smoothing.
 *
 * The photograph's scroll recession is intentionally NOT an animation library
 * job: one passive scroll listener writes a single normalised progress value
 * (`--p`, 0→1) onto the hero, and CSS interpolates transform/opacity/filter
 * from it. That keeps the work on the compositor and avoids a timeline ticking
 * on every scroll event.
 */

import { gsap, anime } from './libs.js';
import { EASE_OUT } from './libs.js';
import { onIntroDone } from './state.js';

export function initHero({ reduced, fine }) {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const lines = hero.querySelectorAll('[data-hero-line]');
  const fades = hero.querySelectorAll('[data-hero-fade]');
  const tagline = hero.querySelector('[data-hero-tagline]');

  if (reduced) {
    gsap.set([...lines, ...fades], { clearProps: 'all' });
    /* still let the photo fade, just without motion — CSS handles that path */
    initPhotoRecession(hero);
    return;
  }

  /* --- 1. line masks ------------------------------------------------- */
  /* One library owns `transform` per element. anime.js drives the reveal,
     so GSAP must not also write yPercent here (they would stack and the
     mask would never open). */
  lines.forEach((l) => {
    l.style.transform = 'translateY(110%)';
  });
  fades.forEach((f) => {
    f.style.opacity = '0';
    f.style.transform = 'translateY(16px)';
  });

  const playIntro = () => {
    anime({
      targets: lines,
      translateY: ['110%', '0%'],
      duration: 1100,
      delay: anime.stagger(90, { start: 60 }),
      easing: EASE_OUT,
      complete: () => {
        lines.forEach((l) => {
          l.style.transform = '';
        });
      },
    });

    anime({
      targets: fades,
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 800,
      delay: anime.stagger(80, { start: 620 }),
      easing: EASE_OUT,
      complete: () => {
        fades.forEach((f) => {
          f.style.transform = '';
          f.style.opacity = '';
        });
      },
    });
  };

  /* Wait for the preloader if it is actually going to play. */
  onIntroDone(playIntro);

  /* --- 2. rotating tagline ------------------------------------------- */
  if (tagline) {
    const words = [...tagline.querySelectorAll('.hero__tagline-item')];
    if (words.length > 1) {
      words.forEach((w, i) => {
        if (i > 0) w.classList.remove('u-sr-only');
        w.style.opacity = i === 0 ? 1 : 0;
      });

      anime({
        targets: words,
        keyframes: [
          { opacity: [0, 1], translateY: [14, 0], duration: 420 },
          { opacity: 1, duration: 1600 },
          { opacity: [1, 0], translateY: [0, -14], duration: 320 },
        ],
        delay: anime.stagger(2600),
        loop: true,
        easing: 'easeOutQuad',
      });
    }
  }

  /* --- 3. magnetic CTA ------------------------------------------------ */
  if (fine) {
    hero.querySelectorAll('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });

      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.28);
      });

      el.addEventListener('pointerleave', () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* --- 4. photograph recession ---------------------------------------- */
  initPhotoRecession(hero);

  /* --- 5. cursor veil -------------------------------------------------
     Only the full-hero wash tracks the pointer. The copy halos are static
     and must not read --mx / --my. */
  if (fine) {
    const glow = hero.querySelector('[data-hero-glow]');
    if (glow) {
      let raf = 0;
      let mx = 50;
      let my = 45;

      const write = () => {
        raf = 0;
        hero.style.setProperty('--mx', mx.toFixed(2) + '%');
        hero.style.setProperty('--my', my.toFixed(2) + '%');
      };

      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width) * 100;
        my = ((e.clientY - r.top) / r.height) * 100;
        if (!raf) raf = requestAnimationFrame(write);
      });

      hero.addEventListener('pointerleave', () => {
        mx = 50;
        my = 45;
        if (!raf) raf = requestAnimationFrame(write);
      });
    }
  }
}

/**
 * Writes `--p` (0 → 1) on the hero as it scrolls away.
 *
 * 0   = page top, photograph at full presence
 * 1   = the hero has been scrolled past, photograph fully receded
 *
 * A single passive listener plus one rAF write per frame. The value is only
 * touched while the hero is on screen, so scrolling further down costs nothing.
 */
function initPhotoRecession(hero) {
  const frame = hero.querySelector('[data-hero-frame]');
  if (!frame) return;

  let raf = 0;
  let ticking = false;
  let visible = true;

  const update = () => {
    ticking = false;
    if (!visible) return;

    const rect = hero.getBoundingClientRect();
    /* progress of the hero being consumed: 0 at top, 1 once the hero's own
       height has scrolled away. Clamped so sub-pixel scroll can't overshoot. */
    const total = rect.height || 1;
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    const p = scrolled / total;

    hero.style.setProperty('--p', p.toFixed(3));
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    raf = requestAnimationFrame(update);
  };

  /* stop doing any work once the hero is off screen */
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) onScroll();
    },
    { threshold: 0, rootMargin: '80px' }
  ).observe(hero);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  update();

  /* release the frame's layer hints once it is fully faded */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
  });
}
