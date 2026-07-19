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
  self.skipWaiting()
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
  self.clients.claim()
})

// Fetch — intenta red primero, caché si falla
self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request)
      .then(function(respuesta) {
        // Si hay internet, actualiza la caché con la versión nueva
        const copia = respuesta.clone()
        caches.open(CACHE).then(function(cache) {
          cache.put(e.request, copia)
        })
        return respuesta
      })
      .catch(function() {
        // Si no hay internet, sirve desde caché
        return caches.match(e.request)
      })
  )
})