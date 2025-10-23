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
   TEAM CAROUSEL – FINAL PREMIUM
   Autoplay + Fade + Motion Blur + Parallax Caption
=============================== */
(() => {
  const viewport = document.getElementById('teamViewport');
  const track    = document.getElementById('teamTrack');
  const prevBtn  = document.getElementById('teamPrev');
  const nextBtn  = document.getElementById('teamNext');
  const dotsWrap = document.getElementById('teamDots');
  if (!viewport || !track) return;

  const slides = Array.from(track.children);

  // === CONFIG ===
  const AUTOPLAY     = true;
  const INTERVAL     = 4200;   // задержка между страницами
  const FADE_OUT_MS  = 160;    // короткий pre-fade перед сменой
  const GAP = (() => {
    const g = getComputedStyle(track).gap || '0';
    return parseFloat(g) || 0;
  })();

  // Кол-во карточек на экране
  const perView = () => {
    const w = viewport.clientWidth;
    if (w >= 1024) return 4;
    if (w >= 768)  return 3;
    if (w >= 640)  return 2;
    return 1;
  };

  const stepWidth = () => {
    const first = slides[0];
    if (!first) return 0;
    return first.getBoundingClientRect().width + GAP;
  };

  const pageCount = () => Math.max(1, slides.length - perView() + 1);

  // === Dots ===
  function buildDots(){
    dotsWrap.innerHTML = '';
    const pages = pageCount();
    for (let i = 0; i < pages; i++){
      const b = document.createElement('button');
      b.type = 'button';
      b.className =
        'w-2.5 h-2.5 rounded-full border border-[var(--early)]/30 ' +
        'aria-[current=true]:w-6 aria-[current=true]:bg-[var(--mint)] ' +
        'aria-[current=true]:border-[var(--mint)] transition-[width,background]';
      b.setAttribute('aria-label', `Slide ${i+1}`);
      b.addEventListener('click', () => go(i, true));
      dotsWrap.appendChild(b);
    }
  }

  let index = 0;
  let timer;
  let isHover = false;

  function clampIndex(i){
    const max = pageCount() - 1;
    return Math.min(Math.max(0, i), max);
  }

  function setDots(){
    const dots = Array.from(dotsWrap.children);
    dots.forEach((d, di) => d.setAttribute('aria-current', di === index ? 'true' : 'false'));
  }

  // === Главная функция рендеринга ===
  function render(withFade = true){
    index = clampIndex(index);
    let x = -(index * stepWidth());
    const totalWidth = slides.length * stepWidth() - GAP; // вся длина карусели
    const maxOffset = totalWidth - viewport.clientWidth;
    if (x < -maxOffset) x = -maxOffset; // чтобы не уходить дальше последнего

    // добавляем флаг "is-moving" для blur и parallax эффектов
    viewport.classList.add('is-moving');

    if (withFade){
      viewport.classList.add('is-fading');
      window.setTimeout(() => {
        track.style.transform = `translateX(${x}px)`;

        viewport.classList.remove('is-fading');
        viewport.classList.add('is-fading-soft');

        // снимаем "мягкие" классы после завершения анимации
        window.setTimeout(() => {
          viewport.classList.remove('is-fading-soft');
          viewport.classList.remove('is-moving');
        }, 640);
      }, FADE_OUT_MS);
    } else {
      track.style.transform = `translateX(${x}px)`;
      window.setTimeout(() => viewport.classList.remove('is-moving'), 380);
    }

    setDots();
    const atStart = index === 0;
    const atEnd   = index === (pageCount() - 1);
    prevBtn?.toggleAttribute('disabled', atStart);
    nextBtn?.toggleAttribute('disabled', atEnd);
  }

  function go(i, manual = false){
    index = clampIndex(i);
    render(true);
    if (manual) restart();
  }

  function nextPage(wrap=false){
    const last = pageCount() - 1;
    if (index >= last) {
      if (wrap) index = 0; else index = last;
    } else index += 1;
    render(true);
  }

  function prevPage(){
    if (index <= 0) index = 0; else index -= 1;
    render(true);
  }

  // === Autoplay ===
  function start(){
    if (!AUTOPLAY) return;
    stop();
    timer = setInterval(() => {
      if (!isHover && document.visibilityState === 'visible') {
        nextPage(true);
      }
    }, INTERVAL);
  }
  function stop(){ if (timer) clearInterval(timer); }
  function restart(){ stop(); start(); }

  // === Events ===
  prevBtn?.addEventListener('click', () => go(index - 1, true));
  nextBtn?.addEventListener('click', () => go(index + 1, true));

  viewport.addEventListener('mouseenter', () => { isHover = true; });
  viewport.addEventListener('mouseleave', () => { isHover = false; });
  viewport.addEventListener('focusin',  stop);
  viewport.addEventListener('focusout', start);

  window.addEventListener('resize', () => {
    const oldPages = dotsWrap.children.length;
    const newPages = pageCount();
    if (oldPages !== newPages) {
      const currentStartItem = index;
      buildDots();
      index = clampIndex(currentStartItem);
    }
    render(false);
  }, { passive:true });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stop(); else start();
  });

  // === INIT ===
  buildDots();
  render(false);
  start();
})();

/* ============ Team ambient zoom/parallax on scroll ============ */
(() => {
  const section = document.getElementById('team');
  if (!section) return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function update() {
    const r  = section.getBoundingClientRect();
    const vh = window.innerHeight || 0;

    // прогресс, когда центр секции ближе к центру экрана → 1
    const centerDist = Math.abs((r.top + r.height/2) - vh/2);
    const norm = clamp(1 - centerDist / (vh * 0.75), 0, 1);

    // параметры эффекта (очень деликатные)
    const zoom = 1 + norm * 0.020;    // до ~1.02
    const glow = norm * 0.35;         // насыщенность + лёгкий blur

    section.style.setProperty('--team-zoom', zoom.toFixed(3));
    section.style.setProperty('--team-glow', glow.toFixed(3));
  }

  // первый вызов и подписки
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
})();

/* ===============================
   TEAM PAGE — Filter & Modal (final)
=============================== */
(() => {
  // Корневой блок отдельной страницы команды
  const teamPage = document.querySelector('[data-team-page]');
  if (!teamPage) return;

  const chipsWrap = teamPage.querySelector('[data-team-chips]');
  const grid      = teamPage.querySelector('[data-team-grid]');
  const modal     = teamPage.querySelector('[data-team-modal]');
  const modalImg  = modal?.querySelector('[data-team-modal-img]');
  const modalCap  = modal?.querySelector('[data-team-modal-cap]');
  const modalClose= modal?.querySelector('[data-team-modal-close]');
  const modalBg   = modal?.querySelector('[data-team-modal-bg]');

  if (!chipsWrap || !grid) return;

  const chips  = Array.from(chipsWrap.querySelectorAll('[data-filter]'));
  const cards  = Array.from(grid.querySelectorAll('[data-tags]'));

  // Утилита: плавное появление карточек
  function fadeIn(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.willChange = 'opacity, transform';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity .35s ease, transform .35s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }

  // Фильтрация по тегу
  function apply(filterKey = 'all') {
    const key = (filterKey || 'all').toLowerCase();

    cards.forEach(card => {
      const tags = (card.getAttribute('data-tags') || '').toLowerCase();
      const show = key === 'all' || tags.split(',').some(t => t.trim() === key);

      // скрываем/показываем без перекомпоновки сетки
      if (show) {
        card.classList.remove('hidden');
        // небольшая пауза, чтобы браузер применил display, и затем анимация
        requestAnimationFrame(() => fadeIn(card));
      } else {
        card.classList.add('hidden');
      }
    });

    // Обновляем активное состояние чипов
    chips.forEach(c => c.classList.toggle('is-active', c.dataset.filter?.toLowerCase() === key));
  }

  // Навешиваем клики на чипы
  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const key = chip.dataset.filter || 'all';
      apply(key);
    });
  });

  // ==== МОДАЛКА (по клику на карточку) ====
  function openModal(imgSrc, title, role) {
    if (!modal) return;
    modalImg.src = imgSrc;
    modalImg.alt = title || '';
    modalCap.textContent = [title, role].filter(Boolean).join(' — ');
    modal.removeAttribute('hidden');
    document.body.classList.add('overflow-hidden');
    // небольшое появление
    requestAnimationFrame(() => modal.classList.add('open'));
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    // дождаться окончания анимации
    setTimeout(() => {
      modal.setAttribute('hidden', 'true');
      modalImg.src = '';
      document.body.classList.remove('overflow-hidden');
    }, 180);
  }

  // Клик по карточке
  cards.forEach(card => {
    const btn = card.querySelector('[data-team-open]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const img = card.querySelector('img');
      const title = card.querySelector('[data-name]')?.textContent?.trim() || '';
      const role  = card.querySelector('[data-role]')?.textContent?.trim() || '';
      openModal(img?.getAttribute('src') || '', title, role);
    });
  });

  // Закрытие модалки
  modalClose?.addEventListener('click', closeModal);
  modalBg?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // ===== ИНИЦИАЛИЗАЦИЯ ПОСЛЕ ЗАГРУЗКИ =====
  window.addEventListener('DOMContentLoaded', () => {
    apply('all'); // ← ключевая правка: вызываем после DOMContentLoaded
    // страховка: активируем визуально "Alle"
    chips.find(c => c.dataset.filter?.toLowerCase() === 'all')?.classList.add('is-active');
  });
})();

/* ===============================
   Team grid: reveal on scroll
=============================== */
(() => {
  const cards = Array.from(document.querySelectorAll('[data-team-grid] article'));
  if (!cards.length) return;

  // Добавим класс + стэггер по ряду (чтобы появлялись «лесенкой»)
  cards.forEach((card, i) => {
    // задержка — по колонке: 0/80/160/240 мс для 4 колонок
    card.style.setProperty('--reveal-delay', `${(i % 4) * 80}ms`);
    card.classList.add('reveal');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, {
    threshold: 0.14,
    rootMargin: '0px 0px -10% 0px'
  });

  cards.forEach(c => io.observe(c));
})();