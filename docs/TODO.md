# TODO — Ce qui reste à faire

> Dernière mise à jour : 2026-05-13
> État du projet : build Vercel ✅ · auth ✅ · messages temps réel ✅ · push notifications câblées (à valider en prod)

---

## 🔴 Priorité haute — fonctionnel cassé ou absent

### 1. Pusher — temps réel vrai
- **Problème** : Pusher est dans `.env` (clés réelles) mais aucune ligne de code dans `src/`
- **Workaround actuel** : polling toutes les 3s via `/api/messages/latest`
- **À faire** :
  - `npm install pusher pusher-js`
  - Créer `src/lib/pusher-server.ts` (client Pusher serveur)
  - Créer `src/lib/pusher-client.ts` (hook `usePusher`)
  - Dans `sendMessage()` : appeler `pusher.trigger(conversationId, 'new-message', payload)`
  - Dans `RealtimeMessages.tsx` : remplacer le `setInterval` par un `useEffect` Pusher
  - Supprimer la route `/api/messages/latest` devenue inutile

### 2. Upload photos tickets
- **Problème** : la page `/tickets/new` affiche "Upload disponible après config UploadThing" — pas de vrai input fichier
- **À faire** :
  - Configurer la route UploadThing `src/app/api/uploadthing/route.ts` (token déjà en `.env`)
  - Créer `src/lib/uploadthing.ts`
  - Remplacer le placeholder par un vrai composant `<UploadButton>` dans le formulaire ticket
  - Stocker les URLs dans `ticket.photoUrls[]`

### 3. Emails transactionnels (Resend)
- **Problème** : `notifications.ts` a un `TODO` vide — aucun email n'est jamais envoyé
- **Clé Resend** : déjà dans `.env` (`re_Hau8z86Z_...`)
- **À faire** :
  - `npm install resend`
  - Créer `src/lib/email.ts` avec `sendEmail()` via Resend
  - Implémenter les templates pour :
    - Invitation à rejoindre la copropriété
    - Notification nouveau message (résumé)
    - Changement de statut ticket
  - Brancher dans `notifyUser()` à la place du `TODO`
  - Vérifier le domaine `orangeraie1.fr` dans le dashboard Resend

### 4. PWA — app installable sur mobile
- **Problème** : pas de `manifest.ts`, pas d'icônes dans `/public/icons/`
- **Le SW est présent** (`/public/sw.js`) mais l'app n'est pas installable
- **À faire** :
  - Créer `src/app/manifest.ts` (nom, couleurs, display: standalone)
  - Générer les icônes (192×192, 512×512, maskable) dans `/public/icons/`
  - Ajouter le lien manifest dans `layout.tsx`
  - Tester l'install sur Chrome mobile

---

## 🟡 Priorité moyenne — UX dégradée

### 5. Auto-scroll dans la conversation
- **Problème** : après `router.refresh()`, la page ne scroll pas automatiquement vers le dernier message
- **À faire** :
  - Dans `RealtimeMessages.tsx` : après `router.refresh()`, appeler `scrollIntoView()` sur le dernier message
  - Ou : passer un `ref` au dernier message depuis le Server Component

### 6. Valider les push notifications en production
- **État** : 2 subscriptions en base, VAPID valide, code correct — mais pas encore testé de bout en bout sur Vercel
- **À faire** :
  - Vérifier que `NEXT_PUBLIC_VAPID_KEY` et `VAPID_PRIVATE_KEY` sont bien dans les env vars Vercel
  - Ouvrir l'app sur le vrai domaine Vercel (HTTPS obligatoire pour push)
  - Aller sur `/settings/notifications`, cliquer "Activer"
  - Envoyer un message depuis un autre compte → vérifier que la notification arrive

### 7. Google OAuth
- **État** : model `Passkey` présent en base, `GOOGLE_CLIENT_ID` en `.env` (vide), aucun provider dans `auth.ts`
- **À faire** (optionnel) :
  - Créer un projet Google Cloud, activer OAuth
  - Ajouter `GoogleProvider` dans `auth.ts`
  - Ajouter le bouton "Connexion avec Google" sur la page login

---

## 🟢 Priorité basse — polish

### 8. Harmonisation design system
- **Pages à vérifier** : `messages/page.tsx` (liste conversations) et `NewConversationModal.tsx`
- **Critère** : pas de classes Tailwind hardcodées (`bg-green-800`, `text-stone-*`) → utiliser `var(--clay)`, `var(--ink)`, `.card`, `.btn-primary`

### 9. Tests
- **État** : quelques unit tests Vitest présents, aucun test E2E
- **À faire** :
  - Tests E2E Playwright pour le flow principal (login → message → notification)
  - Tests des server actions (sendMessage, approveQuote, etc.)

---

## ✅ Déjà fait (session 2026-05-13)

- Fix `Decimal` → `Number(quote.amount)` dans budget/page.tsx
- Fix Zod v4 : `errorMap` → `error` dans ticket-schema.test.ts
- Fix VAPID lazy-init (crash build Next.js)
- Fix `outputFileTracingRoot` doublé sur Vercel
- Fix `.env.local` qui écrasait les vraies clés VAPID avec des placeholders
- Fix re-subscribe push quand permission déjà `granted` au rechargement
- Refactor `notifications.ts` : suppression du `sendPushToUser` dupliqué
- Migration Prisma `lastReadAt` sur `ConversationMember`
- Polling temps réel messages (3s) + `router.refresh()`
- Badge messages non lus dans la nav (poll 10s)
- `markConversationRead` automatique à l'ouverture d'une conversation
- Refactoring design system sur la page conversation (plus de Tailwind hardcodé)
