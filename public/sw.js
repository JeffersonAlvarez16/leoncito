const CACHE_NAME = 'apuestas-pro-v1'
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      })
  )
  self.skipWaiting()
})

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Push event for notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Ver Apuesta'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Nueva Apuesta', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // Handle different actions
  if (event.action === 'close') {
    return // Just close the notification
  }

  // Default action or 'view' action - open the feed
  const urlToOpen = event.notification.data?.betId 
    ? `/feed#bet-${event.notification.data.betId}`
    : '/feed'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url.includes('/feed') && 'focus' in client) {
            // Navigate to specific bet if needed
            if (event.notification.data?.betId) {
              client.postMessage({
                type: 'NAVIGATE_TO_BET',
                betId: event.notification.data.betId
              })
            }
            return client.focus()
          }
        }
        
        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})