import { z } from 'zod'

export const announcementSchema = z.object({
  title:    z.string().min(3, 'Titre trop court').max(150, 'Titre trop long'),
  content:  z.string().min(10, 'Contenu trop court').max(5000, 'Contenu trop long'),
  imageUrl: z.string().url('URL image invalide').optional().or(z.literal('')),
})

export type CreateAnnouncementInput = z.infer<typeof announcementSchema>
