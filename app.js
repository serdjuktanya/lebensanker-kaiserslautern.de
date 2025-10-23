/* ===============================
   Helpers
=============================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

/* ===============================
   Drawer (mobile)
=============================== */
const drawer      = $('#drawer');
const burger      = $('#burger');
const drawerClose = $('#drawerClose');
const backdrop    = $('#backdrop');

function toggleDrawer(open) {
  if (!drawer) return;
  drawer.classList[open ? 'add' : 'remove']('open');
  backdrop?.classList[open ? 'add' : 'remove']('show');
  document.body.classList.toggle('overflow-hidden', open);
}
on(burger, 'click', () => toggleDrawer(true));
on(drawerClose, 'click', () => toggleDrawer(false));
on(backdrop, 'click', () => toggleDrawer(false));
on(window, 'keydown', e => { if (e.key === 'Escape') toggleDrawer(false); });

/* ===============================
   Fade-in on view
=============================== */
(() => {
  const els = $$('.fade-in');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { els.forEach(el => el.classList.add('appear')); return; }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('appear');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  els.forEach(el => io.observe(el));
})();

/* ===============================
   Smart header shrink
=============================== */
(() => {
  const header = $('header[role="banner"]');
  if (!header) return;
  let ticking = false;

  function apply() {
    const y = window.scrollY || 0;
    header.classList.toggle('is-compact', y > 12);
    ticking = false;

    const h = header.getBoundingClientRect().height || 90;
    $$('[id]').forEach(n => n.style.scrollMarginTop = Math.round(h + 10) + 'px');
  }

  apply();
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(apply); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', apply, { passive: true });
})();

/* ===============================
   Scroll-spy
=============================== */
(() => {
  const sectionsMain     = ['about','team','news','karriere','kontakt'];
  const sectionsAngebote = ['angebote','angebot-pflege','tagespflege','angebot-psy','beratung'];
  const allSections      = [...sectionsMain, ...sectionsAngebote];

  const allLinks = $$('a[href^="#"]');
  const navBtnAngebote = $('#navAngeboteBtn');

  function clearActive() {
    $$('.nav-link.active, .sub-link.active, #navAngeboteBtn.active, #drawer a.chip.active')
      .forEach(el => el.classList.remove('active'));
  }

  function setActiveFor(id) {
    clearActive();
    if (sectionsAngebote.includes(id)) {
      navBtnAngebote?.classList.add('active');
      allLinks
        .filter(a => a.getAttribute('href') === `#${id}` && a.classList.contains('sub-link'))
        .forEach(a => a.classList.add('active'));
      return;
    }
    allLinks
      .filter(a => a.classList.contains('nav-link') && a.getAttribute('href') === `#${id}`)
      .forEach(a => a.classList.add('active'));
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) setActiveFor(entry.target.id); });
  }, { threshold: 0.35, rootMargin: '-10% 0px -50% 0px' });

  allSections.forEach(id => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });

  allLinks.forEach(a => {
    a.addEventListener('click', () => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        setActiveFor(href.slice(1));
        toggleDrawer(false);
      }
    });
  });
})();

/* ===============================
   Enhanced <select data-enhance-select>
=============================== */
(() => {
  const selects = $$('select[data-enhance-select]');
  selects.forEach(sel => enhanceSelect(sel));

  function enhanceSelect(native) {
    if (native.__enhanced) return;
    const wrap = document.createElement('div');
    wrap.className = 'enhanced-select';
    native.parentNode.insertBefore(wrap, native);
    wrap.appendChild(native);

    Object.assign(native.style, { position:'absolute', inset:'0', width:'100%', height:'100%', opacity:'0', pointerEvents:'none' });

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'enhanced-select__btn';
    btn.setAttribute('aria-haspopup','listbox');
    btn.setAttribute('aria-expanded','false');

    const labelSpan = document.createElement('span');
    const caret = document.createElementNS('http://www.w3.org/2000/svg','svg');
    caret.setAttribute('width','16');
    caret.setAttribute('height','16');
    caret.setAttribute('viewBox','0 0 24 24');
    caret.classList.add('enhanced-select__chevron');
    caret.innerHTML = `<path fill="currentColor" d="M7 10l5 5 5-5z"/>`;
    btn.append(labelSpan, caret);
    wrap.appendChild(btn);

    const list = document.createElement('div');
    list.className = 'enhanced-select__list';
    list.setAttribute('role','listbox');
    list.hidden = true;
    wrap.appendChild(list);

    Array.from(native.options).forEach((opt, idx) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'enhanced-select__option';
      item.setAttribute('role','option');
      item.dataset.index = String(idx);
      item.textContent = opt.textContent || '';
      if (opt.selected) item.setAttribute('aria-selected','true');
      if (opt.disabled) item.setAttribute('aria-disabled','true');
      on(item, 'click', () => {
        if (opt.disabled) return;
        native.selectedIndex = idx;
        native.dispatchEvent(new Event('change', { bubbles: true }));
        syncUI();
        close();
      });
      list.appendChild(item);
    });

    function currentLabel() {
      const o = native.options[native.selectedIndex];
      return o ? (o.textContent || '') : (native.options[0]?.textContent || 'Wählen…');
    }
    function syncUI() {
      labelSpan.textContent = currentLabel();
      list.querySelectorAll('[aria-selected="true"]').forEach(x => x.removeAttribute('aria-selected'));
      const selBtn = list.querySelector(`[data-index="${native.selectedIndex}"]`);
      if (selBtn) selBtn.setAttribute('aria-selected','true');
      wrap.classList.toggle('has-value', native.selectedIndex > -1 && native.options[native.selectedIndex].value !== '');
    }

    function open() {
      list.hidden = false;
      btn.setAttribute('aria-expanded','true');
      list.querySelector(`[data-index="${native.selectedIndex}"]`)?.scrollIntoView({ block:'nearest' });
      document.addEventListener('click', onDoc, { capture:true });
      document.addEventListener('keydown', onKey);
    }
    function close() {
      list.hidden = true;
      btn.setAttribute('aria-expanded','false');
      document.removeEventListener('click', onDoc, { capture:true });
      document.removeEventListener('keydown', onKey);
    }
    function toggle() { list.hidden ? open() : close(); }
    function onDoc(e) { if (!wrap.contains(e.target)) close(); }
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); btn.focus(); } }

    on(btn, 'click', toggle);
    on(native, 'change', syncUI);
    const form = native.closest('form');
    if (form) on(form, 'submit', (e) => {
      if (native.required && (native.value === '' || native.selectedIndex === 0)) {
        e.preventDefault();
        form.reportValidity?.();
        btn.focus();
      }
    });
    syncUI();
    native.__enhanced = true;
  }
})();

/* ===============================
   Dropdown "Angebote"
=============================== */
(() => {
  const navGroup = $('.nav-group');
  const navBtn   = $('#navAngeboteBtn');
  if (!navGroup || !navBtn) return;

  let closeTimer;
  const open  = () => { navGroup.classList.add('is-open');  navBtn.setAttribute('aria-expanded','true'); };
  const close = () => { navGroup.classList.remove('is-open');navBtn.setAttribute('aria-expanded','false'); };

  on(navBtn, 'click', (e) => { e.preventDefault(); const isOpen = navGroup.classList.toggle('is-open'); navBtn.setAttribute('aria-expanded', String(isOpen)); });
  on(navGroup, 'mouseenter', () => { clearTimeout(closeTimer); open(); });
  on(navGroup, 'mouseleave', () => { closeTimer = setTimeout(close, 120); });
  on(document, 'click', (e) => { if (!navGroup.contains(e.target)) close(); });
  $$('.nav-dropdown a', navGroup).forEach(a => on(a, 'click', close));
})();

/* ===============================
   Header smooth shrink (anti-jitter)
=============================== */
(() => {
  const header = $('header[role="banner"]');
  if (!header) return;
  const SHOW_AT = 40, HYST = 12;
  let ticking = false;

  function onScroll() {
    const y = window.pageYOffset || 0;
    if (!header.classList.contains('is-compact') && y > SHOW_AT) {
      header.classList.add('is-compact');
    } else if (header.classList.contains('is-compact') && y < SHOW_AT - HYST) {
      header.classList.remove('is-compact');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
})();

/* ===============================
   Parallax for .parallax-card
=============================== */
(() => {
  const cards = $$('.parallax-card');
  if (!cards.length) return;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  let ticking = false;

  function update() {
    cards.forEach(card => {
      const media = card.querySelector('.parallax-media');
      if (!media) return;
      const r = card.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = clamp((vh - r.top) / (vh + r.height), 0, 1);
      const amp = parseFloat(card.dataset.parallax) || 60;
      const dy = (progress - 0.5) * amp * 2;
      media.style.transform = `translateY(${dy.toFixed(1)}px) scale(1.03)`;
    });
    ticking = false;
  }

  function onScroll() { if (!ticking) { requestAnimationFrame(update); ticking = true; } }
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();

/* ===============================
   3D Tilt on Scroll (creati style)
=============================== */
(() => {
  const items = $$('.js-tilt-on-scroll');
  if (!items.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  let ticking = false;

  function calcRotate(el) {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const prog = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
    const maxTilt = parseFloat(el.dataset.tilt) || 10;
    const tiltX = (prog - 0.5) * (maxTilt * 2);
    const cx = rect.left + rect.width / 2;
    const normX = (cx / vw) - 0.5;
    const tiltY = normX * (maxTilt * 0.6);
    const shift = 8;
    const ty = (prog - 0.5) * (shift * 2);
    const scale = parseFloat(el.dataset.scale) || 1.04;
    return { tiltX, tiltY, ty, scale };
  }

  function update() {
    items.forEach(el => {
      const media = el.querySelector('.tilt-media');
      if (!media) return;
      const { tiltX, tiltY, ty, scale } = calcRotate(el);
      if (prefersReduced) { media.style.transform = 'translateY(0) scale(1)'; return; }
      media.style.transform =
        `translateY(${ty.toFixed(1)}px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale(${scale})`;
    });
    ticking = false;
  }

  function onScroll() { if (!ticking) { requestAnimationFrame(update); ticking = true; } }
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();




/* скрипт для карусели (слайдеров) */


/* ===============================
   Unser Team — Carousel (final)
   – без «хвоста», с автопрокруткой,
     точками, arrows, swipe/drag
=============================== */
(() => {
  // ── 1) Захватываем элементы (поддержка двух вариантов разметки)
  const viewport =
    document.getElementById('teamViewport') ||
    document.querySelector('#team .team-wrap');
  const track =
    document.getElementById('teamTrack') ||
    viewport?.querySelector('.team-track');
  const prevBtn =
    document.getElementById('teamPrev') ||
    viewport?.querySelector('.team-prev');
  const nextBtn =
    document.getElementById('teamNext') ||
    viewport?.querySelector('.team-next');
  const dotsWrap =
    document.getElementById('teamDots') ||
    viewport?.querySelector('.team-dots');

  if (!viewport || !track) return;

  const slides = Array.from(track.children);

  // ── 2) Вспомогательные расчёты
  const getGap = () => parseFloat(getComputedStyle(track).gap || 0);

  const perView = () => {
    const w = viewport.clientWidth;
    if (w <= 640)  return 1;
    if (w <= 1024) return 2;
    return 3;
  };

  const stepWidth = () => {
    const first = slides[0];
    return first ? first.getBoundingClientRect().width + getGap() : 0;
  };

  const maxScroll = () => {
    const total = track.scrollWidth;    // вся лента
    const view  = viewport.clientWidth; // видимое окно
    return Math.max(0, total - view);
  };

  // «страница» = один шаг по карточке; для точек считаем по страницам
  const pageCount = () => Math.max(1, slides.length - perView() + 1);

  // ── 3) Состояние
  let index = 0;           // страничный индекс (0…pageCount-1)
  let autoplayTimer = null;
  let isHover = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartOffset = 0;

  // ── 4) Точки
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    for (let i = 0; i < pageCount(); i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dot';
      b.setAttribute('aria-label', `Slide ${i + 1}`);
      b.addEventListener('click', () => goTo(i, true));
      dotsWrap.appendChild(b);
    }
  }
  const updateDots = () => {
    if (!dotsWrap) return;
    const dots = Array.from(dotsWrap.children);
    dots.forEach((d, i) =>
      d.classList.toggle('dot--active', i === index)
    );
  };

  // ── 5) Перерисовка
  function clampIndex(i) {
    const max = pageCount() - 1;
    return Math.min(Math.max(0, i), max);
  }
  function render() {
    index = clampIndex(index);
    const desired = index * stepWidth();
    const offset  = Math.min(desired, maxScroll());
    track.style.transform = `translateX(${-offset}px)`;

    // блокируем стрелки на краях (если нет зацикливания)
    prevBtn?.toggleAttribute('disabled', index <= 0);
    nextBtn?.toggleAttribute('disabled', index >= pageCount() - 1);

    updateDots();
  }

  // ── 6) Переходы
  function goTo(i, manual = false) {
    index = clampIndex(i);
    render();
    if (manual) restartAutoplay();
  }
  const goPrev = () => goTo(index - 1, true);
  const goNext = () => goTo(index + 1, true);

  // ── 7) Автопрокрутка (зацикленная)
  function tick() {
    const last = pageCount() - 1;
    index = index >= last ? 0 : index + 1;  // loop
    render();
  }
  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      if (!isHover && document.visibilityState === 'visible' && !isDragging) {
        tick();
      }
    }, 4000);
  }
  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  // ── 8) Навигация: кнопки
  prevBtn?.addEventListener('click', goPrev);
  nextBtn?.addEventListener('click', goNext);

  // ── 9) Hover/focus/visibility
  viewport.addEventListener('mouseenter', () => (isHover = true));
  viewport.addEventListener('mouseleave', () => (isHover = false));
  viewport.addEventListener('focusin', stopAutoplay);
  viewport.addEventListener('focusout', startAutoplay);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') stopAutoplay();
    else startAutoplay();
  });

  // ── 10) Клавиатура
  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    if (e.key === 'ArrowRight'){ e.preventDefault(); goNext(); }
  });
  // делаем контейнер фокусируемым для клавиш
  viewport.tabIndex = viewport.tabIndex || 0;

  // ── 11) Swipe / Drag
  const pointerId = { id: null };
  function onPointerDown(e) {
    if (pointerId.id !== null) return;
    pointerId.id = e.pointerId ?? 'mouse';
    isDragging = true;
    dragStartX = e.clientX;
    // Текущая transform X
    const m = /translateX\((-?\d+\.?\d*)px\)/.exec(getComputedStyle(track).transform);
    dragStartOffset = m ? parseFloat(m[1]) : 0;
    track.style.transition = 'none';
    viewport.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!isDragging || (e.pointerId !== undefined && e.pointerId !== pointerId.id)) return;
    const dx = e.clientX - dragStartX;
    const desired = -(index * stepWidth()) + dx;
    // ограничиваем реальным диапазоном прокрутки
    const min = -maxScroll();
    const max = 0;
    const clamped = Math.max(min - 60, Math.min(max + 60, desired)); // с упругостью
    track.style.transform = `translateX(${clamped}px)`;
  }
  function onPointerUp(e) {
    if (e.pointerId !== undefined && e.pointerId !== pointerId.id) return;
    track.style.transition = ''; // вернуть плавность
    // порог свайпа
    const dx = e.clientX - dragStartX;
    const threshold = Math.max(40, stepWidth() * 0.18);
    if (dx > threshold)      goPrev();
    else if (dx < -threshold) goNext();
    else render(); // откат
    isDragging = false;
    pointerId.id = null;
    viewport.releasePointerCapture?.(e.pointerId);
  }
  viewport.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp);

  // ── 12) Ресайз (и пересборка точек)
  const onResize = () => {
    buildDots();
    render();
  };
  window.addEventListener('resize', onResize, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(viewport);

  // ── 13) Инициализация
  buildDots();
  render();
  startAutoplay();
})();