# Configuration des services externes

> Toutes les étapes pour passer de `localhost` à une application en production fonctionnelle.
> Ordre recommandé : du plus rapide au plus complexe.

---

## Prérequis

Vous avez besoin de :
- Un repo GitHub contenant le projet
- Un compte Vercel (gratuit)
- Un compte Supabase (gratuit)
- Un nom de domaine (optionnel pour les tests, obligatoire en prod)

---

## Étape 1 — Variables VAPID (Push Notifications) · 5 min · 0 €

Les push notifications mobiles/desktop ne nécessitent aucun compte tiers.

```bash
# Dans le dossier /app
cd app
npx web-push generate-vapid-keys
```

Vous obtenez deux clés. Copiez-les dans votre `.env` :

```env
NEXT_PUBLIC_VAPID_KEY="votre_clé_publique_ici"
VAPID_PRIVATE_KEY="votre_clé_privée_ici"
```

> ⚠️ La clé privée ne doit **jamais** être préfixée `NEXT_PUBLIC_` — elle resterait côté serveur uniquement.

---

## Étape 2 — Base de données Supabase · 30 min · 0 €

### 2.1 Créer le projet

1. Aller sur [supabase.com](https://supabase.com) → **New project**
2. Choisir un nom : `orangeraie1`
3. Choisir une région : `West EU (Ireland)` ou `EU Central (Frankfurt)`
4. Définir un mot de passe de base de données (le noter précieusement)
5. Cliquer **Create new project** → attendre ~2 minutes

### 2.2 Récupérer les URLs de connexion

Dans le projet Supabase → **Settings** → **Database** → section **Connection string** :

- Onglet **URI** → copier l'URL (remplacer `[YOUR-PASSWORD]` par votre mot de passe)
- Onglet **Connection pooling** → copier l'URL du pooler (port 6543)

```env
DATABASE_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres"
```

> `DATABASE_URL` utilise le **pooler** (pour l'app en prod).
> `DIRECT_URL` utilise la connexion **directe** (pour les migrations Prisma).

### 2.3 Migrer la base de données

```bash
cd app
# Vérifier que DATABASE_URL et DIRECT_URL sont dans .env
npx prisma migrate deploy
# Vérifier que les tables sont créées
npx prisma studio
```

### 2.4 Créer le premier compte ADMIN

```bash
npx prisma db seed
# ou manuellement via Prisma Studio
```

> Si vous n'avez pas de seed, créez un utilisateur via l'interface de votre app en local, puis passez son statut à `ACTIVE` et son rôle à `ADMIN` directement dans Supabase → **Table editor** → table `User`.

---

## Étape 3 — Déploiement Vercel · 30 min · 0 €

### 3.1 Connecter le repo

1. Aller sur [vercel.com](https://vercel.com) → **Add New Project**
2. Importer le repo GitHub `orangeraie1`
3. **Root Directory** → pointer vers `app/` (là où se trouve `package.json`)
4. Framework : **Next.js** (détecté automatiquement)

### 3.2 Injecter les variables d'environnement

Dans Vercel → **Settings** → **Environment Variables**, ajouter :

```
AUTH_SECRET           → générer avec : openssl rand -base64 64
NEXTAUTH_URL          → https://votre-domaine.fr
DATABASE_URL          → (URL Supabase pooler)
DIRECT_URL            → (URL Supabase directe)
NEXT_PUBLIC_VAPID_KEY → (clé publique VAPID)
VAPID_PRIVATE_KEY     → (clé privée VAPID)
```

> Les variables `NEXT_PUBLIC_*` sont visibles côté client.
> Toutes les autres restent côté serveur uniquement.

### 3.3 Déployer

Cliquer **Deploy**. Vercel lance le build (environ 2-3 minutes).

### 3.4 Vérifier

Ouvrir l'URL de déploiement Vercel → vous devriez voir la page de connexion.

---

## Étape 4 — Emails Resend · 45 min · 0 €

### 4.1 Créer le compte

1. Aller sur [resend.com](https://resend.com) → **Sign up**
2. **API Keys** → **Create API Key** → nom : `orangeraie1-prod`
3. Copier la clé

```env
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="noreply@orangeraie1.fr"
```

### 4.2 Vérifier le domaine (important pour éviter les spams)

1. Dans Resend → **Domains** → **Add Domain** → entrer `orangeraie1.fr`
2. Resend affiche 3 enregistrements DNS à ajouter chez votre registrar :

| Type | Nom | Valeur |
|------|-----|--------|
| TXT  | `resend._domainkey` | `p=...` |
| TXT  | `@` | `v=spf1 include:...` |
| MX   | `send` | `feedback-smtp.eu-east-1.amazonses.com` |

3. Ajouter ces enregistrements chez votre registrar (OVH, Cloudflare, etc.)
4. Cliquer **Verify** dans Resend → attendre 5-60 minutes (propagation DNS)

> Sans vérification de domaine, les emails arrivent en spam ou sont bloqués.

---

## Étape 5 — Messagerie temps réel Pusher · 30 min · 0 €

### 5.1 Créer le compte et l'app

1. Aller sur [pusher.com](https://pusher.com) → **Sign up**
2. **Channels** → **Create app**
3. Remplir :
   - App name : `orangeraie1`
   - Cluster : `eu` (Europe)
   - Frontend : React
   - Backend : Node.js
4. Cliquer **Create app**

### 5.2 Récupérer les clés

Dans l'app Pusher → **App Keys** :

```env
PUSHER_APP_ID="1234567"
PUSHER_KEY="abcdef1234567890"
PUSHER_SECRET="your_secret_here"
PUSHER_CLUSTER="eu"
NEXT_PUBLIC_PUSHER_KEY="abcdef1234567890"
NEXT_PUBLIC_PUSHER_CLUSTER="eu"
```

> `PUSHER_KEY` et `NEXT_PUBLIC_PUSHER_KEY` ont la même valeur — l'une est côté serveur, l'autre côté client.

### 5.3 Activer dans l'app

Installer les packages si ce n'est pas déjà fait :

```bash
cd app
npm install pusher pusher-js
```

---

## Étape 6 — Upload de fichiers UploadThing · 30 min · 0 €

### 6.1 Créer le compte

1. Aller sur [uploadthing.com](https://uploadthing.com) → **Sign up**
2. **Create App** → nom : `orangeraie1`
3. **API Keys** → copier le token

```env
UPLOADTHING_TOKEN="sk_live_xxxxxxxxxxxxxxxxxxxx"
```

### 6.2 Configurer les limites de fichiers

Dans UploadThing → **App Settings** :
- Taille max recommandée : **16 MB** par fichier
- Types autorisés : `pdf, docx, xlsx, png, jpg, jpeg`

> Le Free tier offre **2 Go** de stockage total. Suffisant pour des documents de copropriété (règlements, PV d'AG, etc.).

---

## Étape 7 — Nom de domaine · 10 min · ~7 €/an

### 7.1 Acheter le domaine

Recommandation : [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) — prix de registre sans marge.

1. Créer un compte Cloudflare
2. **Domain Registration** → rechercher `orangeraie1.fr`
3. Acheter (~7 €/an)

### 7.2 Connecter à Vercel

1. Dans Vercel → **Settings** → **Domains** → **Add Domain**
2. Entrer `orangeraie1.fr`
3. Vercel affiche les enregistrements DNS à ajouter :

| Type  | Nom | Valeur |
|-------|-----|--------|
| A     | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

4. Dans Cloudflare → **DNS** → ajouter ces enregistrements
5. Attendre la propagation (5-60 minutes) → Vercel affiche `✓ Valid`

### 7.3 Mettre à jour NEXTAUTH_URL

Dans Vercel → **Environment Variables** → mettre à jour :

```
NEXTAUTH_URL → https://orangeraie1.fr
```

Redéployer (Vercel → **Deployments** → **Redeploy**).

---

## Étape 8 — Google OAuth (optionnel) · 45 min · 0 €

Nécessaire uniquement si vous activez la connexion "Se connecter avec Google".

### 8.1 Créer le projet Google Cloud

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com)
2. **New Project** → nom : `orangeraie1`
3. **APIs & Services** → **OAuth consent screen** :
   - User Type : **External**
   - App name : `Orangeraie 1`
   - Support email : votre email
   - Authorized domains : `orangeraie1.fr`
4. **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs** :
   - Application type : **Web application**
   - Authorized redirect URIs : `https://orangeraie1.fr/api/auth/callback/google`

### 8.2 Récupérer les clés

```env
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxx"
GOOGLE_REDIRECT_URI="https://orangeraie1.fr/api/auth/callback/google"
```

---

## Récapitulatif des variables d'environnement

Voici le `.env` complet à remplir pour la production :

```env
# ── Authentification ──────────────────────────────────────────────
AUTH_SECRET="générer avec : openssl rand -base64 64"
NEXTAUTH_URL="https://orangeraie1.fr"

# ── Base de données ───────────────────────────────────────────────
DATABASE_URL="postgresql://postgres.xxxx:[PWD]@pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:[PWD]@db.xxxx.supabase.co:5432/postgres"

# ── Push Notifications ────────────────────────────────────────────
NEXT_PUBLIC_VAPID_KEY="votre_clé_publique"
VAPID_PRIVATE_KEY="votre_clé_privée"

# ── Emails ────────────────────────────────────────────────────────
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="noreply@orangeraie1.fr"

# ── Temps réel ────────────────────────────────────────────────────
PUSHER_APP_ID="1234567"
PUSHER_KEY="abcdef1234567890"
PUSHER_SECRET="your_secret"
PUSHER_CLUSTER="eu"
NEXT_PUBLIC_PUSHER_KEY="abcdef1234567890"
NEXT_PUBLIC_PUSHER_CLUSTER="eu"

# ── Upload fichiers ───────────────────────────────────────────────
UPLOADTHING_TOKEN="sk_live_xxxxxxxxxxxxxxxxxxxx"

# ── Google OAuth (optionnel) ──────────────────────────────────────
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxx"
GOOGLE_REDIRECT_URI="https://orangeraie1.fr/api/auth/callback/google"
```

---

## Checklist finale avant ouverture

- [ ] `prisma migrate deploy` exécuté sur la base de production
- [ ] Premier compte ADMIN créé et activé
- [ ] Domaine vérifié sur Vercel (HTTPS automatique)
- [ ] Domaine vérifié sur Resend (emails non-spam)
- [ ] Variables d'environnement injectées dans Vercel
- [ ] Test de connexion depuis le navigateur
- [ ] Test d'envoi de message
- [ ] Test d'upload d'un document

---

## Coût mensuel en production (50-200 résidents)

| Service | Plan | Coût/mois |
|---------|------|-----------|
| Vercel  | Hobby | **0 €** |
| Supabase | Free | **0 €** |
| Resend  | Free | **0 €** |
| Pusher  | Sandbox | **0 €** |
| UploadThing | Free | **0 €** |
| Domaine | — | **~0,60 €** |
| **Total** | | **~0,60 €/mois** |

---

*Dernière mise à jour : mai 2026*
