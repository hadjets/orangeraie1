import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Bell } from 'lucide-react'
import { NotificationPreferencesForm } from './NotificationPreferencesForm'

const DEFAULT_PREFS = {
  newMessage:      true,
  ticketUpdate:    true,
  newAnnouncement: true,
  newPoll:         true,
  emailEnabled:    true,
  pushEnabled:     true,
}

export default async function NotificationsSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
  })

  const initialPrefs = prefs
    ? {
        newMessage:      prefs.newMessage,
        ticketUpdate:    prefs.ticketUpdate,
        newAnnouncement: prefs.newAnnouncement,
        newPoll:         prefs.newPoll,
        emailEnabled:    prefs.emailEnabled,
        pushEnabled:     prefs.pushEnabled,
      }
    : DEFAULT_PREFS

  // La clé publique VAPID est lisible côté client (préfixée NEXT_PUBLIC_)
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY ?? ''

  return (
    <div style={{ maxWidth: 580, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#D6EBE0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bell style={{ width: 20, height: 20, color: '#2E6B49' }} />
        </div>
        <div>
          <h1 className="page-title" style={{ fontSize: 22 }}>Notifications</h1>
          <p className="page-subtitle">Gérez vos préférences d&apos;alertes et de communication</p>
        </div>
      </div>

      <NotificationPreferencesForm initialPrefs={initialPrefs} vapidKey={vapidKey} />
    </div>
  )
}
