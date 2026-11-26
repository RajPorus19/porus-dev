/**
 * state.js — tiny shared flags so modules never race on the intro event.
 * The preloader may finish before hero.js has even been imported.
 */

export const state = {
  introDone: false,
};

export function markIntroDone() {
  state.introDone = true;
  window.dispatchEvent(new CustomEvent('home:introdone'));
}

export function onIntroDone(fn) {
  if (state.introDone) {
    fn();
    return;
  }
  window.addEventListener('home:introdone', fn, { once: true });
}
