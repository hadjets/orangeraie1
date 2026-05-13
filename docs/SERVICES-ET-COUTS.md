# Services externes & coûts de mise en ligne

> Référence pour le déploiement de l'application Orangeraie 1.
> Basé sur les variables d'environnement définies dans `.env.example`.

---

## Infrastructure de base

| Service | Usage | Tier gratuit | Coût estimé |
|---|---|---|---|
| **PostgreSQL** — [Supabase](https://supabase.com) | Base de données principale | 500 Mo gratuit | **0 €/mois** (Free) ou **25 $/mois** (Pro) |
| **Redis** — [Upstash](https://upstash.com) | Cache, rate limiting | 10 000 req/jour | **0 €/mois** (Free largement suffisant) |
| **Hébergement Next.js** — [Vercel](https://vercel.com) | Serveur de l'application | 100 Go bandwidth | **0 €/mois** (Hobby) ou **20 $/mois** (Pro) |

> Pour une copropriété de 50–200 résidents :
> **Vercel Hobby + Supabase Free + Upstash Free = 0 €/mois**

---

## Emails — Resend

**Pourquoi** : invitations de résidents, notifications par e-mail, alertes tickets.

| Plan | Volume | Prix |
|---|---|---|
| Free | 3 000 emails/mois, 100/jour | **0 €/mois** |
| Pro | 50 000 emails/mois | **20 $/mois** |

**Réalité** : 50 résidents × 5 emails/mois = 250 emails → Free tier largement suffisant.

**Variables d'env** : `RESEND_API_KEY`, `EMAIL_FROM`

**Étapes** :
1. Créer un compte sur [resend.com](https://resend.com)
2. Générer une clé API
3. Vérifier votre domaine (ex: `@orangeraie1.fr`) en ajoutant 3 enregistrements DNS chez votre registrar → évite que les emails tombent en spam

---

## Fichiers — UploadThing (ou Cloudflare R2)

**Pourquoi** : upload de documents (règlement, comptes-rendus AG, etc.), pièces jointes messages.

### Option A — UploadThing *(recommandé pour démarrer)*

| Plan | Stockage | Bande passante | Prix |
|---|---|---|---|
| Free | 2 Go | 2 Go/mois | **0 €/mois** |
| Pro | 100 Go | 200 Go/mois | **10 $/mois** |

**Variable d'env** : `UPLOADTHING_TOKEN`

**Étapes** : créer un compte sur [uploadthing.com](https://uploadthing.com) → générer un token.

### Option B — Cloudflare R2 *(si > 2 Go de stockage)*

| Usage | Coût |
|---|---|
| Stockage | **0,015 $/Go/mois** |
| Opérations lecture | **0,36 $/million** |
| Egress (téléchargement) | **gratuit** |

**Variables d'env** : `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

---

## Temps réel messagerie — Pusher

**Pourquoi** : les messages apparaissent instantanément sans rafraîchir la page.

| Plan | Connexions simultanées | Messages/jour | Prix |
|---|---|---|---|
| Sandbox (gratuit) | 100 | 200 000 | **0 €/mois** |
| Starter | 500 | 5 millions | **49 $/mois** |

**Réalité** : une résidence de 100 personnes n'atteindra jamais 100 connexions simultanées → Sandbox suffisant.

**Variables d'env** : `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`

**Étapes** : créer un compte sur [pusher.com](https://pusher.com) → créer une app → copier les 4 clés.

> **Alternative gratuite** : remplacer Pusher par des Server-Sent Events (SSE) natifs Next.js.
> Zéro coût, mais demande une refonte de la couche temps réel (quelques jours de travail).

---

## Push Notifications — VAPID

**Pourquoi** : alertes mobile/desktop même lorsque l'application est fermée.

**Coût : 0 €** — VAPID est un standard ouvert, les clés se génèrent en local :

```bash
npx web-push generate-vapid-keys
```

**Variables d'env** : `NEXT_PUBLIC_VAPID_KEY`, `VAPID_PRIVATE_KEY`

Aucun compte tiers nécessaire.

---

## Google OAuth *(module Gmail — optionnel)*

**Pourquoi** : connexion "Se connecter avec Google" + lecture Gmail du syndic.

**Coût : 0 €** — Google Cloud Console gratuit pour < 100 utilisateurs OAuth.

**Variables d'env** : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

**Étapes** :
1. Créer un projet sur [Google Cloud Console](https://console.cloud.google.com)
2. Activer l'API Gmail
3. Créer des identifiants OAuth 2.0
4. Ajouter l'URI de redirection : `https://votre-domaine.fr/api/auth/callback/google`

---

## Nom de domaine

| Registrar | `.fr` | `.com` | Notes |
|---|---|---|---|
| [OVH](https://www.ovh.com) | ~7 €/an | ~10 €/an | Support francophone |
| [Namecheap](https://www.namecheap.com) | ~5 €/an | ~12 €/an | Interface simple |
| [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) | ~8 €/an | ~10 €/an | Prix de registre (pas de marge), DNS inclus |

**Recommandation** : Cloudflare Registrar — prix au coût de registre et DNS géré gratuitement.

---

## Distribution — Web vs App Stores

### Web (PWA) — recommandé

En ajoutant un `manifest.json` + `next-pwa`, l'application devient installable depuis Chrome/Safari
sur mobile et desktop **sans passer par un store**.

- Les résidents accèdent via `https://orangeraie1.fr`
- Ils cliquent "Ajouter à l'écran d'accueil"
- Ils obtiennent une icône comme une vraie application

**Coût : 0 €** — Aucun frais de store, disponible immédiatement après déploiement.

### App Stores (iOS / Android)

> Une app Next.js n'est pas une app native.
> Il faut l'encapsuler avec **Capacitor.js** (3–5 jours de travail) pour la publier sur les stores.

| Store | Frais d'inscription | Récurrence |
|---|---|---|
| Apple App Store | **99 $/an** | Annuel |
| Google Play Store | **25 $** | Une seule fois |

**Délai de validation** : 1–3 jours Apple, quelques heures Google Play.

**Recommandation** : commencer en PWA. Pour une copropriété, les résidents accèdent
depuis un lien envoyé par email — la PWA est suffisante et évite 99 $/an.

---

## Récapitulatif des coûts

### Démarrage — tout gratuit (ou presque)

| Poste | Service | Coût/mois |
|---|---|---|
| Base de données | Supabase Free | **0 €** |
| Hébergement | Vercel Hobby | **0 €** |
| Redis | Upstash Free | **0 €** |
| Emails | Resend Free | **0 €** |
| Fichiers | UploadThing Free | **0 €** |
| Temps réel | Pusher Sandbox | **0 €** |
| Push notifications | VAPID (auto-généré) | **0 €** |
| Nom de domaine | OVH `.fr` | **~0,60 €/mois** |
| **TOTAL mensuel** | | **~0,60 €/mois** |
| **TOTAL annuel** | | **~7 €/an** |

### Passage à l'échelle (> 200 résidents ou usage intensif)

| Poste | Service | Coût/mois |
|---|---|---|
| Base de données | Supabase Pro | **25 $/mois** |
| Hébergement | Vercel Pro | **20 $/mois** |
| Fichiers | UploadThing Pro | **10 $/mois** |
| Emails | Resend Pro | **20 $/mois** |
| Temps réel | Pusher Starter | **49 $/mois** |
| **TOTAL mensuel** | | **~124 $/mois** |

### App Stores (optionnel)

| Poste | Coût |
|---|---|
| Apple Developer Program | **99 $/an** |
| Google Play | **25 $** (une seule fois) |
| Développement Capacitor.js | 3–5 jours de travail |

---

## Ordre de mise en ligne recommandé

| Étape | Action | Durée estimée |
|---|---|---|
| 1 | Acheter le domaine (OVH ou Cloudflare) | 10 min |
| 2 | Créer compte Supabase + migrer la BDD | 1 h |
| 3 | Déployer sur Vercel (connecter le repo GitHub) | 30 min |
| 4 | Créer compte Resend + vérifier le domaine DNS | 1 h |
| 5 | Générer les clés VAPID (`npx web-push generate-vapid-keys`) | 5 min |
| 6 | Créer compte Pusher + copier les 4 clés | 30 min |
| 7 | Créer compte UploadThing + générer le token | 30 min |
| 8 | Configurer la PWA (`manifest.json` + icônes) | 2 h |
| **Total** | **Mise en ligne complète** | **~1 journée de travail + 7 €/an** |

---

*Dernière mise à jour : mai 2026*
