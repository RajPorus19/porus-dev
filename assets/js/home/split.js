/**
 * split.js — text splitting without SplitText (Club plugin).
 * Wraps each word in an inline-block span, preserving nested markup.
 * Returns the created spans so callers can animate them.
 */

export function splitChars(el) {
  if (!el || el.dataset.split === 'chars') return [...el.querySelectorAll('[data-split-char]')];

  const text = el.textContent;
  el.textContent = '';
  const spans = [];

  for (const ch of text) {
    const s = document.createElement('span');
    s.dataset.splitChar = '';
    s.textContent = ch === ' ' ? '\u00A0' : ch;
    s.style.display = 'inline-block';
    s.style.willChange = 'transform';
    el.appendChild(s);
    spans.push(s);
  }

  el.dataset.split = 'chars';
  el.removeAttribute('data-text');
  return spans;
}

export function splitWords(el) {
  if (!el || el.dataset.split === 'words') return [...el.querySelectorAll('[data-split-word]')];

  const words = el.textContent.split(/(\s+)/);
  el.textContent = '';
  const spans = [];

  for (const w of words) {
    if (!w.trim()) {
      el.appendChild(document.createTextNode(w));
      continue;
    }
    const s = document.createElement('span');
    s.dataset.splitWord = '';
    s.style.display = 'inline-block';
    s.style.willChange = 'transform';
    s.textContent = w;
    el.appendChild(s);
    spans.push(s);
  }

  el.dataset.split = 'words';
  return spans;
}
