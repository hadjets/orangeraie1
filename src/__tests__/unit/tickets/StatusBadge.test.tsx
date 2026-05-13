import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/tickets/StatusBadge'
import type { TicketStatus } from '@prisma/client'

describe('StatusBadge', () => {
  const cases: { status: TicketStatus; expectedLabel: string }[] = [
    { status: 'PENDING',     expectedLabel: 'En attente' },
    { status: 'APPROVED',    expectedLabel: 'Approuvé'   },
    { status: 'IN_PROGRESS', expectedLabel: 'En cours'   },
    { status: 'RESOLVED',    expectedLabel: 'Résolu'     },
    { status: 'REJECTED',    expectedLabel: 'Rejeté'     },
  ]

  cases.forEach(({ status, expectedLabel }) => {
    it(`affiche le label correct pour ${status}`, () => {
      render(<StatusBadge status={status} />)
      expect(screen.getByText(expectedLabel)).toBeTruthy()
    })
  })

  it('applique une couleur de fond pour PENDING', () => {
    const { container } = render(<StatusBadge status="PENDING" />)
    const badge = container.querySelector('span')
    // PENDING → fond #FBF0DC (ton ambré)
    expect(badge?.style.background).toBeTruthy()
    expect(badge?.style.color).toBeTruthy()
  })

  it('applique une couleur de fond pour RESOLVED', () => {
    const { container } = render(<StatusBadge status="RESOLVED" />)
    const badge = container.querySelector('span')
    // RESOLVED → fond #D6EBE0 (ton vert)
    expect(badge?.style.background).toBe('#D6EBE0')
  })

  it('applique une couleur de fond pour REJECTED', () => {
    const { container } = render(<StatusBadge status="REJECTED" />)
    const badge = container.querySelector('span')
    // REJECTED → fond #F0EDED (ton neutre)
    expect(badge?.style.background).toBe('#F0EDED')
  })
})
