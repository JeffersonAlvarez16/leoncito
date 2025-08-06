const CACHE_NAME = 'apuestas-pro-v2'
const urlsToCache = [
  '/',
  '/feed',
  '/profile',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Notification storage
let pendingNotifications = []
let isOnline = true

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

// Fetch event with offline support
self.addEventListener('fetch', (event) => {
  // Handle API requests differently
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          isOnline = true
          // Process any pending notifications when back online
          if (pendingNotifications.length > 0) {
            processPendingNotifications()
          }
          return response
        })
        .catch(() => {
          isOnline = false
          // Return a basic offline response for API calls
          return new Response(
            JSON.stringify({ error: 'Offline', offline: true }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          )
        })
    )
    return
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request)
          .then(response => {
            isOnline = true
            return response
          })
          .catch(() => {
            isOnline = false
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/')
            }
          })
      })
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Take control of all clients
      clients.claim(),
      // Register periodic background sync if supported
      self.registration.periodicSync?.register('notification-check', {
        minInterval: 60 * 1000 // Check every minute
      }).catch(err => console.log('Periodic sync not supported:', err))
    ])
  )
})

// Message handler for scheduled notifications
self.addEventListener('message', (event) => {
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    scheduleNotification(event.data.notification)
  } else if (event.data.type === 'CANCEL_NOTIFICATION') {
    cancelNotification(event.data.notificationId)
  } else if (event.data.type === 'SYNC_NOTIFICATIONS') {
    syncNotifications()
  }
})

// Schedule a notification
function scheduleNotification(notification) {
  const delay = new Date(notification.scheduledTime).getTime() - Date.now()
  
  if (delay <= 0) {
    // Show immediately
    showNotification(notification)
    return
  }

  // Store for offline capability
  pendingNotifications.push({
    ...notification,
    timeoutId: setTimeout(() => {
      showNotification(notification)
      // Remove from pending
      pendingNotifications = pendingNotifications.filter(n => n.id !== notification.id)
    }, delay)
  })
}

// Show notification
function showNotification(notification) {
  const options = {
    body: notification.body,
    icon: notification.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: notification.data || {},
    tag: notification.tag,
    requireInteraction: notification.requireInteraction || false,
    silent: false
  }

  self.registration.showNotification(notification.title, options)
}

// Cancel a scheduled notification
function cancelNotification(notificationId) {
  const notification = pendingNotifications.find(n => n.id === notificationId)
  if (notification && notification.timeoutId) {
    clearTimeout(notification.timeoutId)
    pendingNotifications = pendingNotifications.filter(n => n.id !== notificationId)
  }
}

// Process pending notifications when back online
function processPendingNotifications() {
  if (!isOnline) return
  
  // Send any notifications that were missed while offline
  const now = Date.now()
  const missed = pendingNotifications.filter(n => 
    new Date(n.scheduledTime).getTime() <= now && !n.sent
  )
  
  missed.forEach(notification => {
    showNotification(notification)
    notification.sent = true
  })
}

// Sync with server when online
function syncNotifications() {
  if (!isOnline) return
  
  // This would normally sync with the server
  // For now, just process any pending notifications
  processPendingNotifications()
}

// Push event for server-sent notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  showNotification(data)
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
          if ('focus' in client) {
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

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications())
  }
})

// Periodic background sync for checking notifications
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'notification-check') {
    event.waitUntil(syncNotifications())
  }
})