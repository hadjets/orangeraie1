import type { TicketStatus } from '@prisma/client'

const statusConfig: Record<TicketStatus, { label: string; bg: string; color: string; dot: string }> = {
  PENDING:     { label: 'En attente',  bg: '#FBF0DC', color: '#7A5520', dot: '#D4A04A' },
  APPROVED:    { label: 'Approuvé',    bg: '#DCE8F7', color: '#1E4D8A', dot: '#4A7EC4' },
  IN_PROGRESS: { label: 'En cours',    bg: '#F7EDE9', color: '#8B3E2A', dot: '#C07C66' },
  RESOLVED:    { label: 'Résolu',      bg: '#D6EBE0', color: '#1F5C3A', dot: '#3D9E6A' },
  REJECTED:    { label: 'Rejeté',      bg: '#F0EDED', color: '#5C3D3D', dot: '#A07070' },
}

interface StatusBadgeProps { status: TicketStatus }

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, bg, color, dot } = statusConfig[status]
  return (
    <span
      className="badge"
      style={{ background: bg, color, gap: 5, flexShrink: 0 }}
    >
      <span
        style={{
          width: 6, height: 6, borderRadius: '50%',
          background: dot, display: 'inline-block', flexShrink: 0,
        }}
      />
      {label}
    </span>
  )
}
