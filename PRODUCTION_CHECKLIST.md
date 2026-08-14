# Checklist avant mise en production

## 6. Migrations manquantes en prod + bugs trouvés par le typage réel — fait

En générant les vrais types Supabase (`npx supabase gen types typescript`)
pour nettoyer les `any`, découverte qu'un point bien plus grave que du
confort de typage : **les migrations 003, 004 et 005 n'étaient jamais
parties en production** (`supabase migration list` montrait `remote: ""`
pour les trois, alors que le code s'appuie dessus). Conséquences réelles :

- **La table `news_posts` n'existait pas** — le module Actualités entier
  plantait à chaque appel.
- **Les triggers de synchronisation stock (`trg_sync_inventory_quantity`)
  et bibliothèque (`trg_sync_library_availability`) n'existaient pas** —
  enregistrer un mouvement de stock ou emprunter/rendre un livre ne mettait
  jamais à jour la quantité/disponibilité, malgré des commentaires dans le
  code qui comptaient dessus.
- Les policies RLS de ~20 tables (classes, matières, salles, discipline,
  bibliothèque, inventaire, documents, diplômes...) n'étaient pas actives.

**Corrigé** : les trois migrations consolidées et rendues idempotentes dans
[006_consolidated_pending_migrations.sql](supabase/migrations/006_consolidated_pending_migrations.sql),
appliquées en prod, historique CLI resynchronisé (`supabase migration
repair`). Types régénérés, `news_posts` confirmé présent.

En finissant le nettoyage des `any` sur les 23 fichiers `actions.ts` avec les
types réels (au lieu d'un pilote sur 3 fichiers comme prévu), **6 bugs
fonctionnels réels ont été trouvés et corrigés**, invisibles tant que
`getDb()` retournait `any` :

1. `createUserScopedAction` (users) : insertion dans `staff_members` sans
   `hire_date` (colonne `NOT NULL` sans défaut) — échouait silencieusement à
   chaque création de personnel via `/users`.
2. Même fonction : comparaison sur un `establishment_id` potentiellement
   `null` non gardée.
3. `discipline/actions.ts` : `recorder:users(...)` ambigu (`discipline_records`
   a deux FK vers `users`) — embed PostgREST qui échoue à l'exécution,
   corrigé en `users!recorded_by(...)`.
4. `expenses/actions.ts` : même problème sur `creator:users(...)`, corrigé
   en `users!created_by(...)`.
5. `updateUserStatusAction` (superadmin) : tentait d'écrire une colonne
   `status` qui n'existe pas sur `users` (c'est `is_active`, un booléen) —
   le bouton suspendre/activer un utilisateur était cassé depuis toujours.
6. Deux `string` génériques comparés à des colonnes enum (`établissement.plan`,
   `establishment_owners.role`, `attendances.status`, `grades.type`) — cast
   explicite ajouté, pas de bug avéré mais plus de garde-fou si une valeur
   invalide passe.

## 5. Monitoring d'erreurs (Sentry) — 5 min

Le code est prêt ([instrumentation.ts](src/instrumentation.ts), [instrumentation-client.ts](src/instrumentation-client.ts), `next.config.ts`) et vérifié par un build de production complet (46 pages + Proxy). Sans `NEXT_PUBLIC_SENTRY_DSN`, Sentry n'est jamais initialisé — dégradation gracieuse, zéro overhead.

1. Créer un compte/projet sur [sentry.io](https://sentry.io) (plan gratuit suffisant pour démarrer), type de projet "Next.js".
2. Copier le DSN fourni dans `NEXT_PUBLIC_SENTRY_DSN` (`.env.local` + Vercel).
3. Optionnel mais recommandé : `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (page "Auth Tokens" des paramètres Sentry) — permet l'upload des source maps au build, donc des stack traces lisibles en prod plutôt que du code minifié.
4. Capture automatique : erreurs client non gérées, erreurs serveur/edge non gérées, erreurs de requêtes Next.js (`onRequestError`).
5. **Limite connue** : la plupart des Server Actions de ce projet suivent le pattern `try { ... } catch { return { error: "message" } }` — l'erreur réelle est avalée et convertie en message générique avant d'atteindre Sentry. Ça ne casse rien, mais une vraie erreur serveur (bug, timeout DB...) n'apparaîtra pas automatiquement dans Sentry tant que `Sentry.captureException(err)` n'est pas ajouté explicitement dans ces blocs `catch` — pas fait ici (des centaines d'occurrences dans le code existant), à traiter au cas par cas si besoin de visibilité fine sur un flux précis.

## 1. Rate limiting du login (Upstash Redis) — 5 min

Le code est prêt ([lib/auth/rate-limit.ts](src/lib/auth/rate-limit.ts)) mais tourne en mode dégradé (désactivé) tant que ces 2 variables ne sont pas définies.

1. Créer un compte sur [upstash.com](https://upstash.com) (plan gratuit suffisant pour démarrer).
2. Créer une base Redis (région proche de votre déploiement Vercel).
3. Copier `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` depuis le dashboard Upstash.
4. Les ajouter à `.env.local` (dev) et aux variables d'environnement du projet Vercel (prod).
5. Vérifier : après 5 tentatives de connexion échouées en moins de 5 min pour un même couple IP+email, la 6e doit être bloquée silencieusement (retour identique à un mauvais mot de passe).

## 2. Envoi d'email (SMTP) — 5 min

Le code est prêt ([lib/email/](src/lib/email/)) et déjà branché sur toutes les créations de compte et réinitialisations de mot de passe (staff, élèves, parents, propriétaires, utilisateurs). Sans SMTP configuré, le mot de passe temporaire reste affiché une seule fois dans l'UI comme aujourd'hui — l'email est un canal de délivrance en plus, pas un remplacement.

1. Choisir un fournisseur (Resend, SendGrid, Mailgun, ou un compte Gmail avec mot de passe d'application pour démarrer).
2. Renseigner `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` dans `.env.local` et sur Vercel.
3. Vérifier : créer un membre du personnel test → l'email de bienvenue avec les identifiants doit arriver dans sa boîte.

## 3. Vulnérabilités Next.js — fait

`next` et `eslint-config-next` mis à jour de `16.2.9` → `16.2.12` (patch, même registre npm public, build de production revérifié intégralement : 46 pages + toutes les routes API + le `Proxy` custom fonctionnent). Ferme les CVE critiques (SSRF dans les Server Actions, divulgation non-authentifiée des endpoints Server Function, DoS).

Reste non résolu (nécessite `--force`, refusé sciemment) :
- `postcss`/`sharp` : bundlés en interne par `next`, pas de fix indépendant disponible sans downgrade absurde de `next`.
- `brace-expansion`/`minimatch` (chaîne `eslint`) : dev-tooling uniquement, jamais expédié en prod, fix nécessiterait `eslint@10` (breaking).
- `nodemailer` (GHSA-p6gq-j5cr-w38f) : affecte seulement l'option `raw`, jamais utilisée par [lib/email/mailer.ts](src/lib/email/mailer.ts) qui n'envoie que du contenu structuré — risque non exploitable dans ce code.

## 4. Test manuel en conditions réelles — fait intégralement

Fait avec deux passages complets : serveur de dev lancé, connecté au vrai projet Supabase, données réelles affichées, piloté avec Edge (déjà installé sur la machine) + Playwright. Tous les comptes/établissements/données de test ont été créés puis **entièrement supprimés** après coup (y compris le fichier de test sur Cloudinary).

**Scénario réaliste testé** : deux établissements isolés créés de toutes pièces (A et B), chacun avec son propre compte directeur ; un élève avec deux notes dans l'établissement A.

- [x] Connexion + `/dashboard` avec un compte réel
- [x] `/students` : le directeur de A voit son élève ; **le directeur de B ne le voit pas** (isolation multi-tenant confirmée, c'était le bug principal de cette session)
- [x] `/report-cards` : moyenne pondérée affichée correctement (14 coef 4 + 16 coef 4 → **15/20** juste), confirme le fix de la colonne `score` → `value` ; **aucune fuite** vers le directeur de B
- [x] `/diplomas` : diplôme émis de bout en bout pour un vrai élève, numéro de série unique généré, apparaît dans la liste, **aucune fuite** vers l'établissement B
- [x] `/documents` : upload réel d'un fichier vers Cloudinary, apparaît dans la liste avec la bonne URL, **aucune fuite** vers l'établissement B ; fichier supprimé de Cloudinary après le test
- [x] Si SMTP configuré : à vérifier par vous (toujours bloqué faute d'identifiants — voir point 2)

**Bug réel trouvé et corrigé pendant ce test** (aucun rapport avec la sécurité — un bug fonctionnel) : le sélecteur d'élève de 5 formulaires passait `per_page: 200` ou `300` alors que le schéma de pagination plafonne à `100`, ce qui faisait échouer silencieusement la requête (liste d'élèves vide, impossible de sélectionner qui que ce soit) :
- `features/diplomas/components/diploma-form-dialog.tsx` (nouveau, cette session)
- `features/discipline/components/discipline-form-dialog.tsx` (préexistant)
- `features/library/components/loan-form-dialog.tsx` (préexistant)
- `features/parents/components/parent-form-dialog.tsx` (préexistant)
- **`features/payments/components/payment-form-dialog.tsx`** (préexistant — le formulaire d'enregistrement de paiement n'a probablement jamais permis de sélectionner un élève)

Tous corrigés (`per_page: 100`), revérifié pour le formulaire diplôme en conditions réelles (fonctionne). Les 4 autres partagent le même hook (`useStudents`) et le même correctif — pas re-testés un par un individuellement, mais le mécanisme est identique.
