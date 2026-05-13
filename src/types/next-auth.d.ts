import type { Role, AccountStatus } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    role: Role
    status: AccountStatus
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string | null
      role: Role
      status: AccountStatus
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    status: AccountStatus
  }
}
