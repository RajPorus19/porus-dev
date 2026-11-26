/**
 * boot.js — site-wide navigation bootstrap.
 *
 * Runs on every page (home and /projects). Kept deliberately independent from
 * assets/js/home/*, which only exists on the home page: importing that bundle
 * here would pull GSAP and anime.js into /projects for no reason.
 *
 * Everything below is vanilla. The home page's motion layer plays on top.
 */

/* ------------------------------------------------------------------ theme */
function initTheme() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  /* The theme's scripts.html registers its own listener on this button and
     decides the next state from `body.className.includes('dark')`. Two
     listeners fighting produced a no-op toggle.
     So: we do not add a second listener. We only keep <html> and <body> in
     sync with the class the theme already toggles, and persist it. */
  const sync = () => {
    const dark = document.documentElement.classList.contains('dark');
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('pref-theme', dark ? 'dark' : 'light');
  };

  btn.addEventListener('click', () => {
    /* let the theme's own handler run first, then mirror the result */
    requestAnimationFrame(sync);
  });
}

/* ------------------------------------------------- scroll lock (refcount) */
let locks = 0;
function lockScroll() {
  locks += 1;
  document.documentElement.classList.add('is-locked');
}
function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) document.documentElement.classList.remove('is-locked');
}

/* ---------------------------------------------------------- stuck header */
function initStuckHeader() {
  const header = document.getElementById('profileHeader');
  if (!header) return;

  /* The hero no longer has a full-bleed photograph behind the bar, so the bar
     simply follows the page theme; only the stuck state is tracked here. */
  const apply = () => header.classList.toggle('is-stuck', window.scrollY > 24);

  window.addEventListener('scroll', apply, { passive: true });
  window.addEventListener('resize', apply, { passive: true });
  apply();
}

/* ------------------------------------------------------- mobile overlay */
function initMenu() {
  const menu = document.getElementById('mobileMenu');
  const burger = document.querySelector('.nav__burger');
  if (!menu || !burger) return;

  const items = [...menu.querySelectorAll('[data-menu-item]')];
  let open = false;

  const openMenu = () => {
    if (open) return;
    open = true;
    menu.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    lockScroll();
    /* CSS handles the entrance; staggered reveal is home-page only */
    items.forEach((el, i) => {
      el.style.animation = `nav-item-in 480ms cubic-bezier(0.16,1,0.3,1) ${60 + i * 55}ms both`;
    });
  };

  const closeMenu = () => {
    if (!open) return;
    open = false;
    menu.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    unlockScroll();
    items.forEach((el) => {
      el.style.animation = '';
    });
    burger.focus();
  };

  burger.addEventListener('click', () => (open ? closeMenu() : openMenu()));
  document.querySelector('[data-menu-close]')?.addEventListener('click', closeMenu);
  items.forEach((el) => el.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      closeMenu();
    }
  });

  window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
    if (e.matches) closeMenu();
  });

  /* let the palette close the menu before it opens */
  document.addEventListener('menu:close', closeMenu);
}

/* -------------------------------------------------------------- palette */
function initPalette() {
  const root = document.getElementById('palette');
  if (!root) return;

  const list = root.querySelector('.palette__list');
  const input = root.querySelector('.palette__input');
  const empty = root.querySelector('.palette__empty');
  const panel = root.querySelector('.palette__panel');

  let items = null;
  let results = [];
  let active = -1;
  let open = false;
  let returnFocus = null;

  const load = () => {
    if (items) return Promise.resolve(items);
    return fetch('/index.json')
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((data) => {
        items = data;
        return data;
      });
  };

  const score = (text, query) => {
    if (!query) return 1;
    const t = String(text).toLowerCase();
    const q = query.toLowerCase().trim();
    if (!q) return 1;
    if (t.startsWith(q)) return 100 - t.length * 0.1;
    const words = t.split(/[\s\-—·/]+/);
    const wi = words.findIndex((w) => w.startsWith(q));
    if (wi >= 0) return 70 - wi;
    const idx = t.indexOf(q);
    if (idx >= 0) return 40 - idx * 0.1;
    return -1;
  };

  const render = () => {
    list.textContent = '';
    results.forEach((item, i) => {
      const li = document.createElement('li');
      li.className = 'palette__item';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === active));

      const badge = document.createElement('span');
      badge.className = 'palette__item-type';
      badge.textContent = item.type;

      const title = document.createElement('span');
      title.className = 'palette__item-title';
      title.textContent = item.title;

      li.append(badge, title);

      if (item.description) {
        const d = document.createElement('span');
        d.className = 'palette__item-desc';
        d.textContent = item.description;
        li.append(d);
      }

      li.addEventListener('pointerenter', () => {
        active = i;
        paint();
      });
      li.addEventListener('click', () => go(item.url));

      list.append(li);
    });
    empty.hidden = results.length > 0;
  };

  const paint = () => {
    [...list.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
    list.children[active]?.scrollIntoView({ block: 'nearest' });
  };

  const filter = (q) => {
    results = (items || [])
      .map((it) => ({ it, s: Math.max(score(it.title, q), score(it.text || '', q) * 0.8) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((r) => r.it);
    active = results.length ? 0 : -1;
    render();
  };

  const go = (href) => {
    close();
    if (!href) return;
    if (href.startsWith('#')) {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = href;
    }
  };

  const show = async () => {
    if (open) return;
    open = true;
    returnFocus = document.activeElement;
    root.hidden = false;
    lockScroll();
    input.value = '';
    await load();
    filter('');
    input.focus();
  };

  const close = () => {
    if (!open) return;
    open = false;
    root.hidden = true;
    unlockScroll();
    if (returnFocus instanceof HTMLElement) returnFocus.focus();
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-palette-open]')) {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('menu:close'));
      show();
      return;
    }
    if (e.target.closest('[data-palette-close]')) close();
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      open ? close() : show();
      return;
    }
    if (!open) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length) {
        active = (active + 1) % results.length;
        paint();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length) {
        active = (active - 1 + results.length) % results.length;
        paint();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[active]) go(results[active].url);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      input.focus();
    }
  });

  input.addEventListener('input', () => filter(input.value));

  /* modifier hint: Ctrl on non-Apple, ⌘ elsewhere */
  const mod = document.querySelector('.nav__kbd-mod');
  if (mod) mod.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
}

/* ---------------------------------------------------------------- boot */
const boot = () => {
  initTheme();
  initStuckHeader();
  initMenu();
  initPalette();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
