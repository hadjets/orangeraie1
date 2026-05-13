import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes nécessitant un rôle spécifique
const ROLE_ROUTES: Record<string, string[]> = {
  '/admin': ['ADMIN', 'CONSEIL'],
  '/admin/budget': ['CONSEIL', 'ADMIN'],
  '/admin/gmail': ['CONSEIL', 'ADMIN'],
  '/admin/quotes': ['CONSEIL', 'SYNDIC', 'ADMIN'],
  '/admin/announcements': ['SYNDIC', 'CONSEIL', 'ADMIN'],
  '/admin/users': ['ADMIN', 'CONSEIL'],
  '/admin/invitations': ['ADMIN', 'CONSEIL'],
}

// Next.js 16 : la fonction doit s'appeler "proxy" (renommage de "middleware")
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Rediriger vers login si non authentifié
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Rediriger vers pending si compte non validé
  if (session.user.status !== 'ACTIVE') {
    return NextResponse.redirect(new URL('/pending', req.url))
  }

  // Vérifier les permissions par route
  for (const [route, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(route) && !roles.includes(session.user.role)) {
      return NextResponse.redirect(new URL('/feed', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/feed',
    '/feed/:path*',
    '/tickets',
    '/tickets/:path*',
    '/messages',
    '/messages/:path*',
    '/documents',
    '/documents/:path*',
    '/polls',
    '/polls/:path*',
    '/admin',
    '/admin/:path*',
  ],
}

