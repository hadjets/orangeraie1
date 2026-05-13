import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { can } from '@/lib/permissions'
import { validateUser, suspendUser } from './actions'
import { RoleSelect } from './RoleSelect'
import { InviteUserModal } from './InviteUserModal'
import {
  Users, CheckCircle2, Ban, ShieldAlert,
  UserCheck, UserX,
} from 'lucide-react'
import type { Role, UserStatus } from '@prisma/client'

const roleBadge: Record<Role, { label: string; className: string }> = {
  ADMIN:          { label: 'Admin',          className: 'bg-stone-200 text-stone-700'   },
  CONSEIL:        { label: 'Conseil',        className: 'bg-green-100 text-green-800'   },
  SYNDIC:         { label: 'Syndic',         className: 'bg-amber-100 text-amber-800'   },
  COPROPRIETAIRE: { label: 'Copropriétaire', className: 'bg-orange-100 text-orange-800' },
  LOCATAIRE:      { label: 'Locataire',      className: 'bg-lime-100 text-lime-800'     },
}

const statusBadge: Record<UserStatus, { label: string; className: string }> = {
  PENDING:   { label: 'En attente', className: 'bg-amber-100 text-amber-800' },
  ACTIVE:    { label: 'Actif',      className: 'bg-green-100 text-green-800' },
  SUSPENDED: { label: 'Suspendu',   className: 'bg-red-100 text-red-700'     },
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

type UserRow = {
  id: string
  name: string | null
  email: string | null
  role: Role
  status: UserStatus
  createdAt: Date
}

function UserCard({
  user,
  isSelf,
  isAdmin,
}: {
  user:    UserRow
  isSelf:  boolean
  isAdmin: boolean
}) {
  const rb = roleBadge[user.role]
  const sb = statusBadge[user.status]

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-4">
      {/* Avatar + nom */}
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-800 text-xs font-semibold text-white">
          {getInitials(user.name ?? '?')}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-stone-900">
            {user.name}
            {isSelf && <span className="ml-1 text-xs text-stone-400">(vous)</span>}
          </p>
          <p className="truncate text-xs text-stone-400">{user.email}</p>
        </div>
      </div>

      {/* Badges statut + rôle */}
      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${rb.className}`}>
          {rb.label}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sb.className}`}>
          {sb.label}
        </span>
      </div>

      {/* Actions — jamais sur soi-même */}
      {!isSelf && (
        <div className="flex shrink-0 items-center gap-2">
          {/* Activer un compte PENDING ou SUSPENDED */}
          {(user.status === 'PENDING' || user.status === 'SUSPENDED') && (
            <form action={async () => { 'use server'; await validateUser(user.id) }}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-green-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {user.status === 'PENDING' ? 'Activer' : 'Réactiver'}
              </button>
            </form>
          )}

          {/* Suspendre un compte ACTIVE */}
          {user.status === 'ACTIVE' && (
            <form action={async () => { 'use server'; await suspendUser(user.id) }}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-50"
              >
                <Ban className="h-3.5 w-3.5" />
                Suspendre
              </button>
            </form>
          )}

          {/* Changement de rôle — ADMIN uniquement, composant Client */}
          {isAdmin && (
            <RoleSelect userId={user.id} currentRole={user.role} />
          )}
        </div>
      )}
    </div>
  )
}

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!can.validateAccount(session.user.role)) redirect('/admin')

  const users = await prisma.user.findMany({
    orderBy: [{ name: 'asc' }],
    select: {
      id: true, name: true, email: true,
      role: true, status: true, createdAt: true,
    },
  })

  const pending   = users.filter((u) => u.status === 'PENDING')
  const active    = users.filter((u) => u.status === 'ACTIVE')
  const suspended = users.filter((u) => u.status === 'SUSPENDED')

  const isAdmin = session.user.role === 'ADMIN'
  const selfId  = session.user.id

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100">
            <Users className="h-5 w-5 text-stone-700" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-stone-900">Gestion des résidents</h1>
            <p className="text-sm text-stone-500">
              {users.length} compte{users.length > 1 ? 's' : ''}
              {pending.length > 0 && ` · ${pending.length} en attente d'activation`}
            </p>
          </div>
        </div>
        {isAdmin && <InviteUserModal />}
      </div>

      {/* En attente — mis en avant */}
      {pending.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <ShieldAlert className="h-4 w-4" />
            En attente d&apos;activation ({pending.length})
          </h2>
          <div className="divide-y divide-amber-100 rounded-xl border border-amber-100 bg-amber-50 shadow-sm">
            {pending.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isSelf={user.id === selfId}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </section>
      )}

      {/* Actifs */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-600">
          <UserCheck className="h-4 w-4" />
          Actifs ({active.length})
        </h2>
        <div className="divide-y divide-stone-50 rounded-xl border border-stone-100 bg-white shadow-sm">
          {active.length === 0
            ? <p className="px-5 py-4 text-sm text-stone-400">Aucun compte actif.</p>
            : active.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isSelf={user.id === selfId}
                  isAdmin={isAdmin}
                />
              ))
          }
        </div>
      </section>

      {/* Suspendus */}
      {suspended.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-500">
            <UserX className="h-4 w-4" />
            Suspendus ({suspended.length})
          </h2>
          <div className="divide-y divide-stone-50 rounded-xl border border-stone-100 bg-white shadow-sm">
            {suspended.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isSelf={user.id === selfId}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
