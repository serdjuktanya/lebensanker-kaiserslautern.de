// ==============================
// Лёгкий Service Worker для GitHub Pages
// Без агрессивного кэширования CSS и SVG
// ==============================

// Имя кэша (можно менять при каждом обновлении)
const CACHE_NAME = "lebensanker-cache-v3";

// Список файлов, которые можно хранить оффлайн (минимально)
const OFFLINE_URLS = [
  "/",               // главная
  "/index.html",
  "/styles.css",
  "/app.js",
  "/img/og-cover.jpg"
];

// Установка SW и добавление файлов в кэш
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// Активация и удаление старых кэшей
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Стратегия: сначала сеть, если нет — кэш
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Пропускаем chrome-extension, data:, blob:, и POST-запросы
  if (
    !request.url.startsWith("http") ||
    request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Успешный ответ → клонируем в кэш
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request)) // оффлайн-резерв
  );
});

