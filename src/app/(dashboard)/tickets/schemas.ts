import { z } from 'zod'

export const ticketSchema = z.object({
  title:       z.string().min(5, 'Le titre doit faire au moins 5 caracteres').max(100),
  description: z.string().min(10, 'La description doit faire au moins 10 caracteres').max(1000),
  location:    z.enum(['BLOC_A', 'BLOC_B', 'BLOC_C', 'COMMUN']),
  bloc:        z.string().optional(),
  photoUrls:   z.array(z.string().url()).max(5),
})

export type CreateTicketInput = z.infer<typeof ticketSchema>
