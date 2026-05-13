import { prisma } from '@/lib/prisma'
import { acceptInvitation } from '@/app/(dashboard)/admin/users/invite-actions'
import { redirect } from 'next/navigation'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const invitation = await prisma.invitation.findUnique({ where: { token } })

  // ── Token invalide ───────────────────────────────────────────────────────
  if (!invitation) {
    return (
      <InviteLayout>
        <XCircle className="mx-auto h-12 w-12 text-red-400" />
        <h1 className="mt-4 text-lg font-semibold text-stone-900">Lien invalide</h1>
        <p className="mt-2 text-sm text-stone-500">
          Ce lien d&apos;invitation n&apos;existe pas ou a déjà été supprimé.
        </p>
      </InviteLayout>
    )
  }

  // ── Déjà utilisé ─────────────────────────────────────────────────────────
  if (invitation.usedAt) {
    return (
      <InviteLayout>
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="mt-4 text-lg font-semibold text-stone-900">Invitation déjà utilisée</h1>
        <p className="mt-2 text-sm text-stone-500">
          Ce lien a déjà été activé. Connectez-vous directement.
        </p>
        <a
          href="/login"
          className="mt-6 inline-block rounded-lg bg-green-800 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Se connecter
        </a>
      </InviteLayout>
    )
  }

  // ── Expiré ───────────────────────────────────────────────────────────────
  if (new Date() > new Date(invitation.expiresAt)) {
    return (
      <InviteLayout>
        <Clock className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-4 text-lg font-semibold text-stone-900">Invitation expirée</h1>
        <p className="mt-2 text-sm text-stone-500">
          Ce lien a expiré. Demandez un nouveau lien à votre gestionnaire.
        </p>
      </InviteLayout>
    )
  }

  // ── Valide — accepter automatiquement et rediriger ────────────────────────
  try {
    await acceptInvitation(token)
  } catch {
    // Si l'utilisateur n'existe pas encore, on l'invite à créer son compte
    return (
      <InviteLayout>
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="mt-4 text-lg font-semibold text-stone-900">
          Bienvenue dans la résidence
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Créez votre compte avec l&apos;adresse <strong>{invitation.email}</strong>.
          Votre rôle sera attribué automatiquement.
        </p>
        <a
          href={`/login?email=${encodeURIComponent(invitation.email)}&token=${token}`}
          className="mt-6 inline-block rounded-lg bg-green-800 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Créer mon compte
        </a>
      </InviteLayout>
    )
  }

  redirect('/feed')
}

function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mb-2 text-2xl font-bold text-green-900">
          🌿 Orangeraie
        </div>
        {children}
      </div>
    </div>
  )
}
