import { describe, it, expect } from 'vitest'

// Logique pure : contrôle d'accès aux dossiers par rôle
function canAccessFolder(allowedRoles: string[], userRole: string): boolean {
  return allowedRoles.includes(userRole)
}

function canUploadToFolder(userRole: string): boolean {
  return ['ADMIN', 'CONSEIL', 'SYNDIC'].includes(userRole)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return 'pdf'
  if (fileType.includes('image')) return 'image'
  if (fileType.includes('word') || fileType.includes('document')) return 'word'
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'excel'
  return 'file'
}

describe('documents — canAccessFolder', () => {
  it('CONSEIL peut accéder à un dossier CONSEIL+ADMIN', () => {
    expect(canAccessFolder(['ADMIN', 'CONSEIL'], 'CONSEIL')).toBe(true)
  })

  it('LOCATAIRE ne peut pas accéder à un dossier CONSEIL uniquement', () => {
    expect(canAccessFolder(['CONSEIL'], 'LOCATAIRE')).toBe(false)
  })

  it('COPROPRIETAIRE peut accéder aux dossiers publics (TOUS)', () => {
    const allRoles = ['ADMIN', 'CONSEIL', 'SYNDIC', 'COPROPRIETAIRE', 'LOCATAIRE']
    expect(canAccessFolder(allRoles, 'COPROPRIETAIRE')).toBe(true)
  })

  it('LOCATAIRE peut accéder au dossier "Règlement" accessible à tous', () => {
    const allRoles = ['ADMIN', 'CONSEIL', 'SYNDIC', 'COPROPRIETAIRE', 'LOCATAIRE']
    expect(canAccessFolder(allRoles, 'LOCATAIRE')).toBe(true)
  })

  it('SYNDIC ne peut pas accéder à un dossier CONSEIL uniquement', () => {
    expect(canAccessFolder(['CONSEIL', 'ADMIN'], 'SYNDIC')).toBe(false)
  })
})

describe('documents — canUploadToFolder', () => {
  it('ADMIN peut uploader', () => {
    expect(canUploadToFolder('ADMIN')).toBe(true)
  })

  it('CONSEIL peut uploader', () => {
    expect(canUploadToFolder('CONSEIL')).toBe(true)
  })

  it('SYNDIC peut uploader', () => {
    expect(canUploadToFolder('SYNDIC')).toBe(true)
  })

  it('COPROPRIETAIRE ne peut PAS uploader', () => {
    expect(canUploadToFolder('COPROPRIETAIRE')).toBe(false)
  })

  it('LOCATAIRE ne peut PAS uploader', () => {
    expect(canUploadToFolder('LOCATAIRE')).toBe(false)
  })
})

describe('documents — formatFileSize', () => {
  it('affiche les octets en dessous de 1Ko', () => {
    expect(formatFileSize(500)).toBe('500 o')
  })

  it('affiche en Ko entre 1Ko et 1Mo', () => {
    expect(formatFileSize(1536)).toBe('1.5 Ko')
  })

  it('affiche en Mo au-dessus de 1Mo', () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 Mo')
  })
})

describe('documents — getFileIcon', () => {
  it('détecte un PDF', () => {
    expect(getFileIcon('application/pdf')).toBe('pdf')
  })

  it('détecte une image', () => {
    expect(getFileIcon('image/jpeg')).toBe('image')
  })

  it('détecte un document Word', () => {
    expect(getFileIcon('application/msword')).toBe('word')
  })

  it('fallback sur file pour type inconnu', () => {
    expect(getFileIcon('application/octet-stream')).toBe('file')
  })
})
