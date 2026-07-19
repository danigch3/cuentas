const CACHE = 'mis-cuentas-v1'
const ARCHIVOS = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css'
]

// Instalación — guarda los archivos en caché
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ARCHIVOS)
    })
  )
})

// Activación — limpia cachés antiguos
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE })
            .map(function(key) { return caches.delete(key) })
      )
    })
  )
})

// Fetch — sirve desde caché si no hay internet
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request)
    })
  )
})