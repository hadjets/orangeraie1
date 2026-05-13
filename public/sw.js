/**
 * Service Worker — Push Notifications
 * Orangeraie 1
 *
 * Ce fichier doit rester dans /public à la racine du domaine
 * pour avoir le scope "/" complet.
 */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

/** Reçoit une notification push depuis le serveur */
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Orangeraie 1', body: event.data.text() }
  }

  const title   = payload.title   ?? 'Orangeraie 1'
  const options = {
    body:    payload.body    ?? '',
    icon:    payload.icon    ?? '/icons/icon-192.png',
    badge:   payload.badge   ?? '/icons/badge-72.png',
    data:    payload.data    ?? {},
    tag:     payload.tag     ?? 'orangeraie-notif',
    // Reuse+replace if same tag already visible
    renotify: true,
    actions: payload.actions ?? [],
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

/** Clic sur la notification → ouvre/focus l'onglet */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(url) && 'focus' in c)
        if (existing) return existing.focus()
        return self.clients.openWindow(url)
      })
  )
})
