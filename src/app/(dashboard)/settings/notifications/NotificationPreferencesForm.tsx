'use client'

import { useState, useTransition, useEffect } from 'react'
import { updateNotificationPreferences, subscribeWebPush } from './actions'
import { Mail, Smartphone, MessageCircle, Wrench, Megaphone, BarChart2, Loader2, CheckCircle2, BellRing, BellOff } from 'lucide-react'

interface Prefs {
  newMessage: boolean; ticketUpdate: boolean; newAnnouncement: boolean
  newPoll: boolean; emailEnabled: boolean; pushEnabled: boolean
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', display: 'inline-flex',
        width: 40, height: 22, borderRadius: 11,
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? 'var(--clay)' : 'var(--border)',
        transition: 'var(--ease)', flexShrink: 0,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s ease',
      }} />
    </button>
  )
}

const NOTIF_ROWS = [
  { key: 'newMessage'      as const, icon: MessageCircle, label: 'Nouveaux messages',      desc: "Quand quelqu'un vous envoie un message" },
  { key: 'ticketUpdate'    as const, icon: Wrench,        label: 'Mises à jour incidents', desc: 'Changement de statut de vos tickets' },
  { key: 'newAnnouncement' as const, icon: Megaphone,     label: 'Nouvelles annonces',     desc: "Publication d'une annonce sur le feed" },
  { key: 'newPoll'         as const, icon: BarChart2,     label: 'Nouveaux sondages',      desc: 'Quand un sondage vous concerne' },
]

// ── Types permission navigateur ───────────────────────────────────────────
type PermState = 'default' | 'granted' | 'denied' | 'unsupported'

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch {
    return null
  }
}

async function subscribeToPush(vapidKey: string): Promise<PushSubscription | null> {
  const reg = await registerServiceWorker()
  if (!reg) return null

  // Attendre que le SW soit actif
  await reg.update()
  const sw = reg.active ?? reg.installing ?? reg.waiting
  if (!sw) return null

  return reg.pushManager.subscribe({
    userVisibleOnly:      true,
    applicationServerKey: urlB64ToUint8Array(vapidKey).buffer as ArrayBuffer,
  })
}

function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding    = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64     = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData    = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export function NotificationPreferencesForm({ initialPrefs, vapidKey }: { initialPrefs: Prefs; vapidKey: string }) {
  const [prefs, setPrefs]       = useState<Prefs>(initialPrefs)
  const [saved, setSaved]       = useState(false)
  const [isPending, startTransition] = useTransition()

  // ── État permission navigateur ─────────────────────────────────────────
  const [permState, setPermState]     = useState<PermState>('default')
  const [isSubscribing, setSubscribing] = useState(false)
  const [pushError, setPushError]       = useState<string | null>(null)

  useEffect(() => {
    if (!('Notification' in window)) { setPermState('unsupported'); return }
    setPermState(Notification.permission as PermState)
  }, [])

  async function handleEnablePush() {
    if (!('Notification' in window)) return
    setPushError(null)
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      setPermState(permission as PermState)
      if (permission !== 'granted') return

      const sub = await subscribeToPush(vapidKey)
      if (!sub) { setPushError('Impossible d\'activer les notifications.'); return }

      const raw = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      await subscribeWebPush(raw)
    } catch (e) {
      setPushError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSubscribing(false)
    }
  }

  function update(key: keyof Prefs, value: boolean) {
    setSaved(false)
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    startTransition(async () => {
      await updateNotificationPreferences(prefs)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Bandeau permission navigateur */}
      {permState === 'unsupported' && (
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, background: '#F0EDED' }}>
          <BellOff style={{ width: 16, height: 16, color: 'var(--muted)', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Votre navigateur ne prend pas en charge les notifications push.</p>
        </div>
      )}

      {permState === 'denied' && (
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <BellOff style={{ width: 16, height: 16, color: '#B91C1C', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#B91C1C' }}>
            Notifications bloquées par le navigateur. Autorisez-les dans <strong>Paramètres → Site → Notifications</strong> puis rechargez la page.
          </p>
        </div>
      )}

      {permState === 'default' && (
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: '#F5F0EB', border: '1px solid #E8DDD4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BellRing style={{ width: 16, height: 16, color: 'var(--clay)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Activer les notifications push</p>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>Recevez des alertes même quand l&apos;onglet est fermé</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEnablePush}
            disabled={isSubscribing}
            className="btn-primary"
            style={{ flexShrink: 0, fontSize: 13 }}
          >
            {isSubscribing ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />Activation…</> : 'Activer'}
          </button>
        </div>
      )}

      {permState === 'granted' && (
        <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, background: '#D6EBE0' }}>
          <CheckCircle2 style={{ width: 15, height: 15, color: '#2E6B49', flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1F5C3A' }}>Notifications push activées sur cet appareil</p>
        </div>
      )}

      {pushError && (
        <p style={{ fontSize: 12, color: '#B91C1C', paddingLeft: 4 }}>{pushError}</p>
      )}

      {/* Canaux globaux */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 16 }}>Canaux de notification</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { key: 'pushEnabled' as const, icon: Smartphone, label: 'Notifications push', desc: 'Alertes sur votre navigateur ou mobile', color: '#2E6B49' },
            { key: 'emailEnabled' as const, icon: Mail,       label: 'Notifications e-mail', desc: 'Recevez les alertes sur votre adresse e-mail', color: '#8B6020' },
          ].map(({ key, icon: Icon, label, desc, color }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon style={{ width: 16, height: 16, color, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{label}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</p>
                </div>
              </div>
              <Toggle checked={prefs[key]} onChange={(v) => update(key, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Types d'alertes */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 16 }}>Types d&apos;alertes</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {NOTIF_ROWS.map(({ key, icon: Icon, label, desc }, i) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              padding: '14px 0',
              borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Icon style={{ width: 15, height: 15, color: 'var(--muted)', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{label}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</p>
                </div>
              </div>
              <Toggle checked={prefs[key]} onChange={(v) => update(key, v)} disabled={!prefs.pushEnabled && !prefs.emailEnabled} />
            </div>
          ))}
        </div>
      </div>

      {/* Sauvegarde */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button type="button" onClick={handleSave} disabled={isPending} className="btn-primary">
          {isPending
            ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />Sauvegarde…</>
            : 'Sauvegarder les préférences'
          }
        </button>
        {saved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#2E6B49' }}>
            <CheckCircle2 style={{ width: 15, height: 15 }} /> Préférences enregistrées
          </span>
        )}
      </div>
    </div>
  )
}
