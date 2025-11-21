/* ===============================
   Helpers (Унифицированные вспомогательные функции)
=============================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const debounce = (fn, ms = 140) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
};

/**
 * Унифицированный Intersection Observer для добавления класса и отсоединения.
 * @param {string} selector Селектор CSS для элементов.
 * @param {string} className Класс, который нужно добавить при пересечении.
 * @param {number} threshold Порог IntersectionObserver.
 * @param {string} rootMargin Отступ IntersectionObserver.
 */
function observeElements(selector, className, threshold = 0.2, rootMargin = '0px') {
  const els = $$(selector);
  if (!els.length || !("IntersectionObserver" in window) || prefersReduced) {
    // Если reduced motion, просто добавляем класс видимости
    els.forEach((el) => el.classList.add(className));
    return;
  }

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add(className);
        obs.unobserve(e.target);
      }
    });
  }, { threshold, rootMargin });

  els.forEach((el) => io.observe(el));
}


/* ===============================
   Drawer (mobile)
=============================== */
const drawer = $("#drawer");
const burger = $("#burger");
const drawerClose = $("#drawerClose");
const backdrop = $("#backdrop");

function toggleDrawer(open) {
  if (!drawer) return;
  const shouldOpen = open === undefined ? !drawer.classList.contains("open") : open;

  drawer.classList.toggle("open", shouldOpen);
  backdrop?.classList.toggle("show", shouldOpen);
  document.body.classList.toggle("overflow-hidden", shouldOpen);
}
on(burger, "click", () => toggleDrawer(true));
on(drawerClose, "click", () => toggleDrawer(false));
on(backdrop, "click", () => toggleDrawer(false));
on(window, "keydown", (e) => {
  if (e.key === "Escape") toggleDrawer(false);
});


/* ===============================
   Fade-in on view + заголовки секций
=============================== */
(() => {
  // Общее плавное появление блоков с .fade-in
  observeElements(".fade-in", "is-visible", 0.15, "0px 0px -10% 0px");

  // Заголовки секций h2.fx-title — добавляем .is-visible,
  // чтобы по CSS поехала линия ::after и сам заголовок «выплыл»
  observeElements("section h2.fx-title", "is-visible", 0.3, "0px 0px -10% 0px");

  // Карточки партнёров
  observeElements("#partner .partner-card", "visible", 0.2, "0px 0px -10% 0px");

  // Карточки новостей (News)
  observeElements("#news article", "is-visible", 0.2);

  // Карточки команды (Unser Team)
  const teamCards = $$("[data-team-grid] article");
  teamCards.forEach((card, i) => {
    // необязательная задержка для ступенчатого появления
    card.style.setProperty("--reveal-delay", `${(i % 4) * 80}ms`);
    card.classList.add("reveal");
  });
  observeElements("[data-team-grid] article", "in", 0.14, "0px 0px -10% 0px");

  // Карточки карьеры (Karriere)
  const karCards = $$("#karriere .job-card");
  karCards.forEach((el, i) => {
    el.style.setProperty("--reveal-delay", `${100 + i * 120}ms`);
  });
  observeElements("#karriere .job-card", "is-visible", 0.2, "0px 0px -10% 0px");

  // Заголовок Karriere с модификатором classic (если ты его используешь)
  observeElements("#karriere .fx-title.fx-title--classic", "is-visible", 0.4);

  // Секция отзывов (Reviews) — чтобы добавить класс .reviews-in
  observeElements("#reviews", "reviews-in", 0.25);
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
    header.classList.toggle("is-compact", y > 12);
    ticking = false;

    const h = header.getBoundingClientRect().height || 90;
    $$("[id]").forEach((n) => {
      n.style.scrollMarginTop = Math.round(h + 10) + "px";
    });
  }

  apply();
  on(window, "scroll", () => {
    if (!ticking) {
      requestAnimationFrame(apply);
      ticking = true;
    }
  }, { passive: true });
  on(window, "resize", apply, { passive: true });
})();


/* ===============================
   Scroll-spy
=============================== */
(() => {
  const sectionsMain = ["about", "angebote", "team", "news", "karriere", "kontakt"];
  const sectionsAngebote = ["angebot-pflege", "tagespflege", "beratung"];
  const allSections = [...sectionsMain, ...sectionsAngebote];
  const allLinks = $$('a[href^="#"]');
  const navBtnAngebote = $("#navAngeboteBtn");

  const sectionEls = allSections
    .map((id) => ({ id, el: document.getElementById(id) }))
    .filter((s) => s.el);

  if (!sectionEls.length) return;

  function clearActive() {
    $$(".nav-link.active, .sub-link.active, #navAngeboteBtn.active, #drawer a.chip.active")
      .forEach((el) => el.classList.remove("active"));
  }

  function setActiveFor(id) {
    clearActive();

    if (sectionsAngebote.includes(id) || id === "angebote") {
      navBtnAngebote?.classList.add("active");

      allLinks
        .filter(
          (a) =>
            a.classList.contains("sub-link") &&
            a.getAttribute("href") === `#${id}`
        )
        .forEach((a) => a.classList.add("active"));
    } else {
      allLinks
        .filter(
          (a) =>
            a.classList.contains("nav-link") &&
            a.getAttribute("href") === `#${id}`
        )
        .forEach((a) => a.classList.add("active"));
    }

    $(`#drawer a.chip[href="#${id}"]`)?.classList.add("active");
  }

  function updateOnScroll() {
    const viewportCenter = window.innerHeight / 2;
    let best = null;

    sectionEls.forEach(({ id, el }) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const center = rect.top + rect.height / 2;
      const diff = Math.abs(center - viewportCenter);

      if (!best || diff < best.diff) {
        best = { id, diff };
      }
    });

    if (best) setActiveFor(best.id);
  }

  let scrollTimeout = null;
  on(window, "scroll", () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateOnScroll, 80);
  });
  on(window, "resize", updateOnScroll);

  allLinks.forEach((a) => {
    on(a, "click", () => {
      const href = a.getAttribute("href") || "";
      if (href.startsWith("#")) {
        setActiveFor(href.slice(1));
        if (typeof toggleDrawer === "function") toggleDrawer(false);
      }
    });
  });

  updateOnScroll();
})();


/* ===============================
   Enhanced <select data-enhance-select>
=============================== */
(() => {
  const selects = $$("select[data-enhance-select]");
  selects.forEach((sel) => enhanceSelect(sel));

  function enhanceSelect(native) {
    if (native.__enhanced) return;

    const wrap = document.createElement("div");
    wrap.className = "enhanced-select";
    native.parentNode.insertBefore(wrap, native);
    wrap.appendChild(native);

    Object.assign(native.style, {
      position: "absolute", inset: "0", width: "100%", height: "100%",
      opacity: "0", pointerEvents: "none",
    });

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "enhanced-select__btn";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");

    const labelSpan = document.createElement("span");
    const caret = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    caret.setAttribute("width", "16"); caret.setAttribute("height", "16");
    caret.setAttribute("viewBox", "0 0 24 24");
    caret.classList.add("enhanced-select__chevron");
    caret.innerHTML = `<path fill="currentColor" d="M7 10l5 5 5-5z"/>`;

    btn.append(labelSpan, caret);
    wrap.appendChild(btn);

    const list = document.createElement("div");
    list.className = "enhanced-select__list";
    list.setAttribute("role", "listbox");
    list.hidden = true;
    wrap.appendChild(list);

    Array.from(native.options).forEach((opt, idx) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "enhanced-select__option";
      item.setAttribute("role", "option");
      item.dataset.index = String(idx);
      item.textContent = opt.textContent || "";

      if (opt.selected) item.setAttribute("aria-selected", "true");
      if (opt.disabled) item.setAttribute("aria-disabled", "true");

      on(item, "click", () => {
        if (opt.disabled) return;
        native.selectedIndex = idx;
        native.dispatchEvent(new Event("change", { bubbles: true }));
        syncUI();
        close();
      });

      list.appendChild(item);
    });

    function currentLabel() {
      const o = native.options[native.selectedIndex];
      return o ? o.textContent || "" : native.options[0]?.textContent || "Wählen…";
    }

    function syncUI() {
      labelSpan.textContent = currentLabel();
      list.querySelectorAll('[aria-selected="true"]').forEach((x) => x.removeAttribute("aria-selected"));

      const selBtn = list.querySelector(`[data-index="${native.selectedIndex}"]`);
      if (selBtn) selBtn.setAttribute("aria-selected", "true");

      const hasValue = native.selectedIndex > -1 && native.options[native.selectedIndex].value !== "";
      wrap.classList.toggle("has-value", hasValue);
    }

    function open() {
      list.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      list.querySelector(`[data-index="${native.selectedIndex}"]`)?.scrollIntoView({ block: "nearest" });
      on(document, "click", onDoc, { capture: true });
      on(document, "keydown", onKey);
    }

    function close() {
      list.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      document.removeEventListener("click", onDoc, { capture: true });
      document.removeEventListener("keydown", onKey);
    }

    function toggle() {
      list.hidden ? open() : close();
    }

    function onDoc(e) {
      if (!wrap.contains(e.target)) close();
    }

    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        btn.focus();
      }
    }

    on(btn, "click", toggle);
    on(native, "change", syncUI);

    const form = native.closest("form");
    if (form) {
      on(form, "submit", (e) => {
        if (native.required && (native.value === "" || native.selectedIndex === 0)) {
          e.preventDefault();
          form.reportValidity?.();
          btn.focus();
        }
      });
    }

    syncUI();
    native.__enhanced = true;
  }
})();

/* ===============================
   Dropdown "Angebote"
=============================== */
(() => {
  const navGroup = $(".nav-group");
  const navBtn = $("#navAngeboteBtn");
  if (!navGroup || !navBtn) return;

  let closeTimer;

  const open = () => {
    navGroup.classList.add("is-open");
    navBtn.setAttribute("aria-expanded", "true");
  };

  const close = () => {
    navGroup.classList.remove("is-open");
    navBtn.setAttribute("aria-expanded", "false");
  };

  on(navBtn, "click", (e) => {
    e.preventDefault();
    const isOpen = navGroup.classList.toggle("is-open");
    navBtn.setAttribute("aria-expanded", String(isOpen));
  });

  on(navGroup, "mouseenter", () => {
    clearTimeout(closeTimer);
    open();
  });

  on(navGroup, "mouseleave", () => {
    closeTimer = setTimeout(close, 120);
  });

  on(document, "click", (e) => {
    if (!navGroup.contains(e.target)) close();
  });

  $$(".nav-dropdown a", navGroup).forEach((a) => on(a, "click", close));
})();

/* ===============================
   Parallax for .parallax-card
=============================== */
(() => {
  const cards = $$(".parallax-card");
  if (!cards.length) return;
  let ticking = false;

  function update() {
    cards.forEach((card) => {
      const media = card.querySelector(".parallax-media");
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

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  update();
  on(window, "scroll", onScroll, { passive: true });
  on(window, "resize", onScroll);
})();

/* ===============================
   3D Tilt on Scroll (.js-tilt-on-scroll)
=============================== */
(() => {
  const items = $$(".js-tilt-on-scroll");
  if (!items.length) return;
  let ticking = false;

  function calcRotate(el) {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    const prog = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
    const maxTilt = parseFloat(el.dataset.tilt) || 10;

    const tiltX = (prog - 0.5) * (maxTilt * 2);
    const cx = rect.left + rect.width / 2;
    const normX = cx / vw - 0.5;
    const tiltY = normX * (maxTilt * 0.6);

    const shift = 8;
    const ty = (prog - 0.5) * (shift * 2);
    const scale = parseFloat(el.dataset.scale) || 1.04;

    return { tiltX, tiltY, ty, scale };
  }

  function update() {
    items.forEach((el) => {
      const media = el.querySelector(".tilt-media");
      if (!media) return;

      if (prefersReduced) {
        media.style.transform = "translateY(0) scale(1)";
        return;
      }

      const { tiltX, tiltY, ty, scale } = calcRotate(el);
      media.style.transform = `translateY(${ty.toFixed(1)}px) rotateX(${tiltX.toFixed(
        2
      )}deg) rotateY(${tiltY.toFixed(2)}deg) scale(${scale})`;
    });
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  update();
  on(window, "scroll", onScroll, { passive: true });
  on(window, "resize", onScroll);
})();

/* ===============================
   TEAM CAROUSEL
=============================== */
(() => {
  const viewport = document.getElementById("teamViewport");
  const track = document.getElementById("teamTrack");
  const prevBtn = document.getElementById("teamPrev");
  const nextBtn = document.getElementById("teamNext");
  const dotsWrap = document.getElementById("teamDots");
  if (!viewport || !track) return;

  const slides = Array.from(track.children);
  const AUTOPLAY = true;
  const INTERVAL = 4200;
  const FADE_OUT_MS = 160;

  const getGap = () => parseFloat(getComputedStyle(track).gap || "0") || 0;
  const perView = () => {
    const w = viewport.clientWidth;
    if (w >= 1024) return 4;
    if (w >= 768) return 3;
    if (w >= 640) return 2;
    return 1;
  };
  const stepWidth = () => {
    const first = slides[0];
    return first ? first.getBoundingClientRect().width + getGap() : 0;
  };
  const pageCount = () => Math.max(1, slides.length - perView() + 1);

  let index = 0;
  let timer = null;
  let isHover = false;

  const clampIndex = (i) => clamp(i, 0, pageCount() - 1);

  function buildDots() {
    dotsWrap.innerHTML = "";
    const pages = pageCount();

    for (let i = 0; i < pages; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className =
        "w-2.5 h-2.5 rounded-full border border-[var(--early)]/30 aria-[current=true]:w-6 aria-[current=true]:bg-[var(--mint)] aria-[current=true]:border-[var(--mint)] transition-[width,background]";
      b.setAttribute("aria-label", `Slide ${i + 1}`);
      on(b, "click", () => go(i, true));
      dotsWrap.appendChild(b);
    }
  }

  function updateDots() {
    Array.from(dotsWrap.children).forEach((d, di) => d.setAttribute("aria-current", di === index ? "true" : "false"));
  }

  function updateButtons() {
    const atStart = index === 0;
    const atEnd = index === pageCount() - 1;
    prevBtn?.toggleAttribute("disabled", atStart);
    nextBtn?.toggleAttribute("disabled", atEnd);
  }

  function computeOffset() {
    const step = stepWidth();
    if (!step) return 0;

    let x = -(index * step);
    const totalWidth = slides.length * step - getGap();
    const maxOffset = totalWidth - viewport.clientWidth;

    if (x < -maxOffset) x = -maxOffset;
    return x;
  }

  function render(withFade = true) {
    index = clampIndex(index);
    const x = computeOffset();

    viewport.classList.add("is-moving");

    if (withFade) {
      viewport.classList.add("is-fading");

      window.setTimeout(() => {
        track.style.transform = `translateX(${x}px)`;

        viewport.classList.remove("is-fading");
        viewport.classList.add("is-fading-soft");

        window.setTimeout(() => {
          viewport.classList.remove("is-fading-soft");
          viewport.classList.remove("is-moving");
        }, 640);
      }, FADE_OUT_MS);
    } else {
      track.style.transform = `translateX(${x}px)`;
      window.setTimeout(() => viewport.classList.remove("is-moving"), 380);
    }

    updateDots();
    updateButtons();
  }

  function go(i, manual = false) {
    index = clampIndex(i);
    render(true);
    if (manual) restart();
  }

  function nextPage(wrap = false) {
    const last = pageCount() - 1;
    if (index >= last) {
      index = wrap ? 0 : last;
    } else {
      index += 1;
    }
    render(true);
  }

  function start() {
    if (!AUTOPLAY) return;
    stop();
    timer = setInterval(() => {
      if (!isHover && document.visibilityState === "visible") {
        nextPage(true);
      }
    }, INTERVAL);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function restart() {
    stop();
    start();
  }

  on(prevBtn, "click", () => go(index - 1, true));
  on(nextBtn, "click", () => go(index + 1, true));

  on(viewport, "mouseenter", () => isHover = true);
  on(viewport, "mouseleave", () => isHover = false);
  on(viewport, "focusin", stop);
  on(viewport, "focusout", start);

  on(window, "resize", () => {
    const oldPages = dotsWrap.children.length;
    const newPages = pageCount();

    if (oldPages !== newPages) {
      const currentStartItem = index;
      buildDots();
      index = clampIndex(currentStartItem);
    }

    render(false);
  }, { passive: true });

  on(document, "visibilitychange", () => document.visibilityState === "hidden" ? stop() : start());

  buildDots();
  render(false);
  start();
})();

/* ============ Team ambient zoom/parallax on scroll ============ */
(() => {
  const section = document.getElementById("team");
  if (!section) return;
  let ticking = false;

  function update() {
    const r = section.getBoundingClientRect();
    const vh = window.innerHeight || 0;

    const centerDist = Math.abs(r.top + r.height / 2 - vh / 2);
    const norm = clamp(1 - centerDist / (vh * 0.75), 0, 1);

    const zoom = 1 + norm * 0.02;
    const glow = norm * 0.35;

    section.style.setProperty("--team-zoom", zoom.toFixed(3));
    section.style.setProperty("--team-glow", glow.toFixed(3));
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  update();
  on(window, "scroll", onScroll, { passive: true });
  on(window, "resize", onScroll, { passive: true });
})();

/* ===============================
   TEAM PAGE — Filter & Modal
=============================== */
(() => {
  const teamPage = document.querySelector("[data-team-page]");
  if (!teamPage) return;

  const chipsWrap = teamPage.querySelector("[data-team-chips]");
  const grid = teamPage.querySelector("[data-team-grid]");
  const modal = teamPage.querySelector("[data-team-modal]");
  const modalImg = modal?.querySelector("[data-team-modal-img]");
  const modalCap = modal?.querySelector("[data-team-modal-cap]");
  const modalClose = modal?.querySelector("[data-team-modal-close]");
  const modalBg = modal?.querySelector("[data-team-modal-bg]");

  if (!chipsWrap || !grid) return;

  const chips = Array.from(chipsWrap.querySelectorAll("[data-filter]"));
  const cards = Array.from(grid.querySelectorAll("[data-tags]"));

  function fadeIn(el) {
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
    el.style.willChange = "opacity, transform";
    requestAnimationFrame(() => {
      el.style.transition = "opacity .35s ease, transform .35s ease";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
  }

  function apply(filterKey = "all") {
    const key = (filterKey || "all").toLowerCase();

    cards.forEach((card) => {
      const tags = (card.getAttribute("data-tags") || "").toLowerCase();
      const show = key === "all" || tags.split(",").some((t) => t.trim() === key);

      if (show) {
        card.classList.remove("hidden");
        requestAnimationFrame(() => fadeIn(card));
      } else {
        card.classList.add("hidden");
      }
    });

    chips.forEach((c) => c.classList.toggle("is-active", c.dataset.filter?.toLowerCase() === key));
  }

  chips.forEach((chip) => {
    on(chip, "click", (e) => {
      e.preventDefault();
      apply(chip.dataset.filter || "all");
    });
  });

  function openModal(imgSrc, title, role) {
    if (!modal) return;
    modalImg.src = imgSrc;
    modalImg.alt = title || "";
    modalCap.textContent = [title, role].filter(Boolean).join(" — ");
    modal.removeAttribute("hidden");
    document.body.classList.add("overflow-hidden");
    requestAnimationFrame(() => modal.classList.add("open"));
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    setTimeout(() => {
      modal.setAttribute("hidden", "true");
      modalImg.src = "";
      document.body.classList.remove("overflow-hidden");
    }, 180);
  }

  cards.forEach((card) => {
    const btn = card.querySelector("[data-team-open]");
    if (!btn) return;

    on(btn, "click", () => {
      const img = card.querySelector("img");
      const title = card.querySelector("[data-name]")?.textContent?.trim() || "";
      const role = card.querySelector("[data-role]")?.textContent?.trim() || "";
      openModal(img?.getAttribute("src") || "", title, role);
    });
  });

  on(modalClose, "click", closeModal);
  on(modalBg, "click", closeModal);
  on(document, "keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  on(window, "DOMContentLoaded", () => {
    apply("all");
    chips.find((c) => c.dataset.filter?.toLowerCase() === "all")?.classList.add("is-active");
  });
})();

/* ===============================
   Feedback/Reviews slider
=============================== */
(() => {
  const viewport = document.getElementById("feedbackViewport");
  const track = document.getElementById("feedbackTrack");
  const dotsWrap = document.getElementById("feedbackDots");
  if (!viewport || !track) return;

  const slides = Array.from(track.children);
  let index = 0;
  let timer;
  let isHover = false;

  const AUTOPLAY = true;
  const INTERVAL = 5000;

  function buildDots() {
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Slide ${i + 1}`);
      on(b, "click", () => {
        index = i;
        render(true);
        restart();
      });
      dotsWrap.appendChild(b);
    });
  }

  function render(animate = true) {
    const x = -(index * viewport.clientWidth);
    track.style.transitionDuration = animate ? "600ms" : "0ms";
    track.style.transform = `translateX(${x}px)`;

    Array.from(dotsWrap.children).forEach((d, i) => {
      d.setAttribute("aria-current", i === index ? "true" : "false");
    });
  }

  function next() {
    index = (index + 1) % slides.length;
    render(true);
  }

  function start() {
    if (!AUTOPLAY) return;
    stop();
    timer = setInterval(() => {
      if (!isHover && document.visibilityState === "visible") next();
    }, INTERVAL);
  }

  function stop() {
    if (timer) clearInterval(timer);
  }

  function restart() {
    stop();
    start();
  }

  on(viewport, "mouseenter", () => isHover = true);
  on(viewport, "mouseleave", () => isHover = false);
  on(window, "resize", () => render(false), { passive: true });
  on(document, "visibilitychange", () => document.visibilityState === "hidden" ? stop() : start());

  buildDots();
  render(false);
  start();
})();

/* ===============================
   News cards: parallax hover
=============================== */
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll("#news article");
  const canHover = window.matchMedia("(hover:hover)").matches;
  if (!cards.length || !canHover) return;

  cards.forEach((card) => {
    const img = card.querySelector(".news-thumb img");
    if (!img) return;

    let rafId = null;

    function onMove(ev) {
      const rect = card.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((ev.clientY - rect.top) / rect.height) * 2 - 1;
      const max = 10;

      const tx = (-x * max).toFixed(2) + "px";
      const ty = (-y * max).toFixed(2) + "px";

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        img.style.setProperty("--tx", tx);
        img.style.setProperty("--ty", ty);
      });
    }

    function onLeave() {
      if (rafId) cancelAnimationFrame(rafId);
      img.style.setProperty("--tx", "0px");
      img.style.setProperty("--ty", "0px");
    }

    on(card, "mousemove", onMove);
    on(card, "mouseleave", onLeave);
  });
});

/* ===============================
   Waves parallax (.wave[data-parallax])
=============================== */
(() => {
  const waves = Array.from(document.querySelectorAll(".wave[data-parallax]"));
  if (!waves.length) return;

  const state = new Set();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) state.add(e.target);
        else state.delete(e.target);
      });
    },
    { rootMargin: "100px 0px" }
  );

  waves.forEach((w) => io.observe(w));

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const vh = window.innerHeight;
      state.forEach((wave) => {
        const speed = parseFloat(wave.dataset.speed || "0.28");
        const rect = wave.getBoundingClientRect();
        const centerOffset = rect.top + rect.height / 2 - vh / 2;
        const amount = -centerOffset * speed * 0.15;
        wave.style.setProperty("--wy", `${amount.toFixed(2)}px`);
      });
      ticking = false;
    });
  }

  onScroll();
  on(window, "scroll", onScroll, { passive: true });
  on(window, "resize", onScroll);
})();


/* ===============================
   FAQ unified: search + highlight + deep-link
=============================== */
(function () {
  const scope = document.querySelector("#faq");
  if (!scope) return;

  const search = scope.querySelector("#faqSearch");
  const clear = scope.querySelector("#faqClear");
  const emptyUI = scope.querySelector("#faqEmpty");
  const counter = scope.querySelector("#faqCounter");

  const items = Array.from(scope.querySelectorAll("details.faq-item, #faqList details"));
  const summaries = items.map((d) => d.querySelector("summary.faq-q"));

  // Подготовка меток (lbl) для поиска и подсветки
  summaries.forEach((sum) => {
    if (!sum) return;

    // Если faq-label уже есть, убеждаемся, что dataset.label заполнен
    if (sum.querySelector(".faq-label")) {
      const lblExisting = sum.querySelector(".faq-label");
      if (lblExisting && !lblExisting.dataset.label) {
        lblExisting.dataset.label = lblExisting.textContent.trim();
      }
      return;
    }

    // Восстановление оригинальной структуры (создание faq-label)
    const ico = sum.querySelector(".faq-ico");
    const lbl = document.createElement("span");
    lbl.className = "faq-label";
    const nodes = Array.from(sum.childNodes);
    let take = !ico;
    nodes.forEach((n) => {
      if (n === ico) { take = true; return; }
      if (take) lbl.appendChild(n);
    });
    lbl.dataset.label = (lbl.textContent || "").trim();
    sum.appendChild(lbl);
  });

  const labels = summaries.map((s) => s?.querySelector(".faq-label"));

  const norm = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  function unmark(labelEl) {
    if (!labelEl) return;
    labelEl.querySelectorAll("mark.faq-hit").forEach((m) => {
      m.replaceWith(document.createTextNode(m.textContent));
    });
  }

  function highlight(labelEl, qRaw) {
    unmark(labelEl);
    if (!qRaw || !labelEl) return;

    const raw = labelEl.dataset.label || labelEl.textContent || "";
    const rawLower = raw.toLowerCase();
    const qLower = qRaw.toLowerCase();

    const i = rawLower.indexOf(qLower);
    if (i < 0) {
      labelEl.textContent = raw;
      return;
    }

    const before = raw.slice(0, i);
    const hit = raw.slice(i, i + qRaw.length);
    const after = raw.slice(i + qRaw.length);

    labelEl.innerHTML = "";
    const mark = document.createElement("mark");
    mark.className = "faq-hit";
    mark.textContent = hit;
    labelEl.append(document.createTextNode(before), mark, document.createTextNode(after));
  }

  function applyFilter() {
    const qRaw = (search?.value || "").trim();
    const q = norm(qRaw);
    let visible = 0;

    items.forEach((d, idx) => {
      const lbl = labels[idx];
      const sumTxt = lbl?.dataset?.label || "";
      const ansTxt = d.querySelector(".faq-a")?.textContent || "";
      const hay = norm(sumTxt + " " + ansTxt);
      const match = !q || hay.includes(q);

      d.classList.toggle("is-hidden", !match);
      if (match) visible++;

      highlight(lbl, qRaw);
      if (q && match) d.open = false;
    });

    emptyUI?.classList.toggle("hidden", !(qRaw && visible === 0));

    if (counter) {
      counter.textContent = qRaw
        ? visible
          ? `${visible} Treffer`
          : "Keine Ergebnisse"
        : "";
    }

    if (qRaw) {
      const first = items.find((d) => !d.classList.contains("is-hidden"));
      if (first && !first.open) first.open = true;
    }

    if (clear) {
      clear.hidden = qRaw.length === 0;
    }
  }

  on(search, "input", debounce(applyFilter, 120));

  on(search, "keydown", (e) => {
    if (e.key === "Escape") {
      search.value = "";
      applyFilter();
    }
  });

  on(clear, "click", () => {
    if (!search) return;
    search.value = "";
    applyFilter();
    search.focus();
  });

  on(scope, "toggle", (e) => {
    const d = e.target;
    if (d.tagName !== "DETAILS" || !d.open) return;

    items.forEach((i) => {
      if (i !== d) i.open = false;
    });

    d.scrollIntoView({ behavior: "smooth", block: "start" });
    if (d.id) history.replaceState(null, "", `#${d.id}`);
  });

  function openFromHash() {
    const id = location.hash.replace("#", "");
    if (!id) return;

    const target = scope.querySelector(`details#${CSS.escape(id)}`);
    if (target) {
      target.open = true;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  on(window, "hashchange", openFromHash);

  applyFilter();
  openFromHash();
})();


/* ===============================
   отправка формы: автоустановка e-mail получателя в зависимости от темы
=============================== */
document.addEventListener('DOMContentLoaded', function () {
  const topicSelect = document.getElementById('fTopic');
  const recipientField = document.getElementById('recipientField');

  if (!topicSelect || !recipientField) return;

  // соответствие "значение option" → "e-mail"
  const RECIPIENT_MAP = {
    ambulant:   'ambulant@lebensanker-kaiserslautern.de',
    tagespflege:'tagespflege@lebensanker-kaiserslautern.de',
    // psychiatrisch: 'ambulant@lebensanker-kaiserslautern.de', // на будущее
    beratung:   'info@lebensanker-kaiserslautern.de'
  };

  const DEFAULT_MAIL = 'mail@lebensanker-kaiserslautern.de';

  function updateRecipient() {
    const key = topicSelect.value;
    recipientField.value = RECIPIENT_MAP[key] || DEFAULT_MAIL;
  }

  // при загрузке страницы и при изменении выбора
  updateRecipient();
  on(topicSelect, 'change', updateRecipient);
});

// Добавление класса 'appear' для заголовков.
// Это было в оригинальном коде, но частично дублировало логику выше.
// В унифицированной версии это учтено в observeElements.
/*
document.addEventListener("DOMContentLoaded", () => {
  const titles = document.querySelectorAll(".fx-title");
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("appear");
      }
    });
  }, { threshold: 0.4 });
  titles.forEach(t => obs.observe(t));
});
*/

(() => {
  // ...
  observeElements(".fade-in", "is-visible", 0.15, "0px 0px -10% 0px");
  observeElements("section h2.fx-title", "is-visible", 0.3, "0px 0px -10% 0px");
  observeElements("#partner .partner-card", "visible", 0.2, "0px 0px -10% 0px");
  observeElements("#news article", "is-visible", 0.2);

  // 👉 ДОБАВЬ ЭТО:
  observeElements(".btn-career-all", "is-visible", 0.25, "0px 0px -10% 0px");

  // дальше — как у тебя
})();
