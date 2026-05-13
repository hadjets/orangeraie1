'use client'

import { useTransition } from 'react'
import { changeUserRole } from './actions'
import type { Role } from '@prisma/client'
import { Loader2 } from 'lucide-react'

const ALL_ROLES: { value: Role; label: string }[] = [
  { value: 'ADMIN',          label: 'Admin'          },
  { value: 'CONSEIL',        label: 'Conseil'        },
  { value: 'SYNDIC',         label: 'Syndic'         },
  { value: 'COPROPRIETAIRE', label: 'Copropriétaire' },
  { value: 'LOCATAIRE',      label: 'Locataire'      },
]

interface RoleSelectProps {
  userId:      string
  currentRole: Role
}

export function RoleSelect({ userId, currentRole }: RoleSelectProps) {
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as Role
    if (newRole === currentRole) return
    startTransition(async () => {
      await changeUserRole(userId, newRole)
    })
  }

  return (
    <div className="flex items-center gap-1">
      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-400" />}
      <select
        value={currentRole}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-700 focus:border-orange-400 focus:outline-none disabled:opacity-50"
      >
        {ALL_ROLES.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
    </div>
  )
}
