import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Orangeraie 1 — Connexion',
  description: 'Accédez à votre espace de gestion de la copropriété Orangeraie 1',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
