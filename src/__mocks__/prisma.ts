import { vi } from 'vitest'

// Mock du client Prisma — jamais de connexion DB réelle en tests unitaires
export const prisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  account: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  invitation: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  ticket: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  ticketComment: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  message: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  deletedMessage: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
  },
  conversation: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  conversationMember: {
    findUnique: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
  },
  announcement: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  poll: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  pollResponse: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
  },
  document: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  documentFolder: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    createMany: vi.fn(),
    upsert: vi.fn(),
  },
  notificationPreference: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  pushSubscription: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  budgetLine: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  quote: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  expense: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({ prisma }))
