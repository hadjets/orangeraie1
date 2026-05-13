import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'
import { User } from 'lucide-react'

const roleBadge: Record<string, { label: string; className: string }> = {
  ADMIN:          { label: 'Admin',          className: 'bg-stone-200 text-stone-700'   },
  CONSEIL:        { label: 'Conseil',        className: 'bg-green-100 text-green-800'   },
  SYNDIC:         { label: 'Syndic',         className: 'bg-amber-100 text-amber-800'   },
  COPROPRIETAIRE: { label: 'Copropriétaire', className: 'bg-orange-100 text-orange-800' },
  LOCATAIRE:      { label: 'Locataire',      className: 'bg-lime-100 text-lime-800'     },
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, apartment: true, bloc: true, createdAt: true },
  })
  if (!user) redirect('/login')

  const rb = roleBadge[user.role] ?? { label: user.role, className: 'bg-stone-100 text-stone-600' }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100">
          <User className="h-5 w-5 text-stone-700" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Mon profil</h1>
          <p className="text-sm text-stone-500">Vos informations personnelles</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Carte identité — colonne gauche */}
        <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-800 text-xl font-bold text-white">
              {getInitials(user.name)}
            </div>
            <p className="mt-3 text-base font-semibold text-stone-900">{user.name}</p>
            <p className="text-sm text-stone-500">{user.email}</p>
            <span className={`mt-2 rounded-full px-3 py-1 text-xs font-medium ${rb.className}`}>
              {rb.label}
            </span>
            {(user.apartment || user.bloc) && (
              <p className="mt-3 text-xs text-stone-400">
                {[user.bloc, user.apartment].filter(Boolean).join(' · ')}
              </p>
            )}
            <p className="mt-2 text-[11px] text-stone-300">
              Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Formulaire — colonne droite */}
        <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-5 text-sm font-semibold text-stone-900">Modifier mes informations</h2>
          <ProfileForm
            initialName={user.name}
            initialApartment={user.apartment}
            initialBloc={user.bloc}
          />
        </div>
      </div>
    </div>
  )
}
