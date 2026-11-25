// Site enhancements. Everything works without this file.
// 1. Mobile menu: opens as a dialog with focus kept inside, Escape and the close button shut it.
// 2. Sections fade and lift 12px the first time they scroll into view (not with reduced motion).
(() => {
  const root = document.documentElement;

  // ---------- 1. menu ----------
  const menu = document.getElementById('menu');
  const opener = document.querySelector('.menu-btn');
  const closer = menu?.querySelector('.menu__close');
  if (menu && opener && closer) {
    opener.setAttribute('role', 'button');
    closer.setAttribute('role', 'button');
    menu.setAttribute('aria-modal', 'true');
    const focusables = () => [...menu.querySelectorAll('a[href], button')];

    const open = () => {
      menu.classList.add('is-open');
      opener.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      focusables()[0]?.focus();
    };
    const close = ({ restore = true } = {}) => {
      menu.classList.remove('is-open');
      opener.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      if (location.hash === '#menu') history.replaceState(null, '', location.pathname + location.search);
      if (restore) opener.focus();
    };

    opener.addEventListener('click', (e) => {
      e.preventDefault();
      open();
    });
    closer.addEventListener('click', (e) => {
      e.preventDefault();
      close();
    });
    // A link inside the menu: close first, then let the browser follow it (it may be an anchor on this page).
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a') && !e.target.closest('.menu__close')) close({ restore: false });
    });
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') return close();
      if (e.key !== 'Tab') return;
      const f = focusables();
      const [first, last] = [f[0], f[f.length - 1]];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    // Widening the window past the phone layout closes the menu.
    matchMedia('(min-width: 1080px)').addEventListener('change', (m) => m.matches && menu.classList.contains('is-open') && close({ restore: false }));
    if (location.hash === '#menu') open();
  }

  // ---------- 2. reveal ----------
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sections = [...document.querySelectorAll('.reveal')];
  if (reduced || !('IntersectionObserver' in window) || !sections.length) return;
  // Anything already on screen stays put; only what's below the fold animates in.
  const fold = innerHeight;
  for (const s of sections) if (s.getBoundingClientRect().top < fold) s.classList.add('is-in');
  root.classList.add('motion');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  for (const s of sections) if (!s.classList.contains('is-in')) io.observe(s);

  // "See how I work" and other in-page links: move focus to the section for keyboard users.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]:not(.menu-btn):not(.menu__close)');
    const target = a && document.getElementById(a.getAttribute('href').slice(1));
    if (target?.classList.contains('reveal')) target.classList.add('is-in');
  });
})();

// 3. Work: the filter row filters in place (the links still work without JavaScript, via ?type=).
// 4. Video tiles: a muted preview on hover with a mouse, with a sound toggle. Never with reduced motion.
// 5. The full-screen player on ink, for videos and brand images. Without JavaScript, tiles open the file itself.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- 3. filter ----------
  const filters = document.querySelector('.filters');
  if (filters) {
    const cards = [...document.querySelectorAll('.work-grid--index > .card')];
    const status = document.querySelector('[data-filter-status]');
    filters.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-filter]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      const type = a.dataset.filter;
      let shown = 0;
      for (const c of cards) {
        const on = !type || c.dataset.type === type;
        c.hidden = !on;
        if (on) shown++;
      }
      for (const l of filters.querySelectorAll('a')) {
        if (l === a) l.setAttribute('aria-current', 'page');
        else l.removeAttribute('aria-current');
      }
      const gridEl = document.querySelector('.work-grid--index');
      if (gridEl) gridEl.dataset.showing = type || 'all';
      if (status) status.textContent = `${shown} ${shown === 1 ? 'item' : 'items'}`;
      history.replaceState(null, '', type ? `/work?type=${type}` : '/work');
    });
  }

  // ---------- 4. tile previews ----------
  if (finePointer && !reduced) {
    for (const tile of document.querySelectorAll('.vtile')) {
      const video = tile.querySelector('video');
      const sound = tile.querySelector('.vtile__sound');
      if (!video) continue;
      let leaveTimer;
      const start = () => {
        clearTimeout(leaveTimer);
        if (!video.src) video.src = video.dataset.src;
        video.muted = sound?.getAttribute('aria-pressed') !== 'true';
        video.play().then(() => tile.classList.add('is-playing')).catch(() => {});
        if (sound) sound.hidden = false;
      };
      const stop = () => {
        leaveTimer = setTimeout(() => {
          video.pause();
          tile.classList.remove('is-playing');
          if (sound) sound.hidden = true;
        }, 120);
      };
      tile.addEventListener('mouseenter', start);
      tile.addEventListener('mouseleave', stop);
      sound?.addEventListener('click', () => {
        const on = sound.getAttribute('aria-pressed') !== 'true';
        sound.setAttribute('aria-pressed', String(on));
        video.muted = !on;
      });
    }
  }

  // ---------- 5. player ----------
  const dialog = document.getElementById('player');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const title = dialog.querySelector('.player__title');
  const versions = dialog.querySelector('.player__versions');
  const stage = dialog.querySelector('.player__stage');
  let opener = null;

  const showVideo = (item) => {
    stage.replaceChildren();
    const v = document.createElement('video');
    v.src = item.src;
    v.controls = true;
    v.playsInline = true;
    v.preload = 'metadata';
    v.width = item.w;
    v.height = item.h;
    if (item.poster) v.poster = item.poster;
    stage.append(v);
    // Opening the player is a deliberate click, so it plays, except with reduced motion: then you press play.
    if (!reduced) v.play().catch(() => {});
  };

  const open = (data, from) => {
    opener = from;
    title.textContent = data.title;
    versions.replaceChildren();
    stage.className = `player__stage${data.kind === 'image' ? ' player__stage--images' : ''}`;
    if (data.kind === 'image') {
      stage.replaceChildren(
        ...data.items.map((i, n) => Object.assign(document.createElement('img'), { src: i.src, width: i.w, height: i.h, alt: i.alt ?? `${data.title}, image ${n + 1} of ${data.items.length}` })),
      );
    } else {
      if (data.items.length > 1) {
        data.items.forEach((item, n) => {
          const b = Object.assign(document.createElement('button'), { type: 'button', textContent: item.label ?? `Version ${n + 1}` });
          b.setAttribute('aria-pressed', String(n === 0));
          b.addEventListener('click', () => {
            for (const x of versions.children) x.setAttribute('aria-pressed', String(x === b));
            showVideo(item);
          });
          versions.append(b);
        });
      }
      showVideo(data.items[0]);
    }
    document.body.classList.add('player-open');
    dialog.showModal();
    dialog.querySelector('.player__close').focus();
  };

  dialog.querySelector('.player__close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    stage.querySelectorAll('video').forEach((v) => v.pause());
    stage.replaceChildren();
    document.body.classList.remove('player-open');
    opener?.focus();
  });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-player]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    a.closest('.vtile')?.querySelector('video')?.pause();
    open(JSON.parse(a.dataset.player), a);
  });
})();

// 6. A case study's logo animation: plays on a loop once it's on screen, with a pause button.
//    With reduced motion (or no JavaScript) it stays on its poster frame.
(() => {
  const vids = document.querySelectorAll('video[data-motion]');
  if (!vids.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  vids.forEach((v) => {
    const btn = v.parentElement.querySelector('.motion__toggle');
    let paused = false;
    const set = (p) => {
      paused = p;
      btn.textContent = p ? 'Play animation' : 'Pause animation';
      if (p) v.pause();
      else v.play().catch(() => {});
    };
    btn.hidden = false;
    btn.addEventListener('click', () => set(!paused));
    new IntersectionObserver(([e]) => {
      if (paused) return;
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }).observe(v);
  });
})();
