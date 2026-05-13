'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from './actions'
import { Save, Loader2, CheckCircle2 } from 'lucide-react'

interface ProfileFormProps {
  initialName:      string
  initialApartment: string | null
  initialBloc:      string | null
}

export function ProfileForm({ initialName, initialApartment, initialBloc }: ProfileFormProps) {
  const [name,      setName]      = useState(initialName)
  const [apartment, setApartment] = useState(initialApartment ?? '')
  const [bloc,      setBloc]      = useState(initialBloc ?? '')
  const [error,     setError]     = useState<string | null>(null)
  const [saved,     setSaved]     = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        await updateProfile({
          name,
          apartment: apartment || undefined,
          bloc:      bloc      || undefined,
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nom complet */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-stone-700">Nom complet</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {/* Appartement */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-stone-700">
          Appartement
          <span className="ml-1 font-normal text-stone-400">(optionnel)</span>
        </label>
        <input
          type="text"
          value={apartment}
          onChange={(e) => setApartment(e.target.value)}
          placeholder="ex: A12"
          className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {/* Bâtiment */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-stone-700">
          Bâtiment / Bloc
          <span className="ml-1 font-normal text-stone-400">(optionnel)</span>
        </label>
        <input
          type="text"
          value={bloc}
          onChange={(e) => setBloc(e.target.value)}
          placeholder="ex: Bâtiment B"
          className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-500 disabled:opacity-50"
        >
          {isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Save className="h-4 w-4" />
          }
          Enregistrer
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Modifications enregistrées
          </span>
        )}
      </div>
    </form>
  )
}
