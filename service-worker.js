// ---- SW config ----
const CACHE_NAME = "app-v3";            // меняй версию при обновлениях
const PRECACHE = [
  // опционально: "/index.html", "/styles.css", "/script.js", "/icons/icon-192.png"
];

// ---- Install: предварительный кэш + skipWaiting ----
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        if (PRECACHE.length) await cache.addAll(PRECACHE);
      } catch (_) { /* молча игнорируем */ }
      await self.skipWaiting();
    })()
  );
});

// ---- Activate: чистим старые кэши + захватываем клиентов ----
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
      await self.clients.claim();
    })()
  );
});

// ---- Helpers ----
const isHttp = (req) => {
  try { return /^https?:$/.test(new URL(req.url).protocol); }
  catch { return false; }
};
const sameOrigin = (req) => {
  try { return new URL(req.url).origin === self.location.origin; }
  catch { return false; }
};

// ---- Fetch: безопасные стратегии ----
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Кэшируем только http(s) GET; не трогаем chrome-extension, data:, ws:, POST и т.д.
  if (!isHttp(req) || req.method !== "GET") return;

  // Для переходов/HTML — network-first (чтобы не застревала старая версия)
  const isNavigation = req.mode === "navigate" ||
                       (req.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Для статики своего домена — cache-first; чужие домены оставляем как есть
  if (sameOrigin(req)) {
    event.respondWith(cacheFirst(req));
  }
  // Иначе не вмешиваемся (CDN, шрифты и т.п.)
});

// ---- Strategies ----
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const resp = await fetch(request);
    // Кладём только успешные «basic» ответы (same-origin)
    if (resp.ok && resp.type === "basic") cache.put(request, resp.clone());
    return resp;
  } catch {
    return cached || Response.error();
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const resp = await fetch(request, { cache: "no-store" });
    if (resp.ok && (resp.type === "basic" || resp.type === "cors")) {
      cache.put(request, resp.clone());
    }
    return resp;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response("<h1>Offline</h1>", {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 503
    });
  }
}
