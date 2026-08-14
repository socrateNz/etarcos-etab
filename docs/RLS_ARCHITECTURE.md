# RLS ↔ NextAuth : état actuel et pourquoi ce n'est pas branché

## En bref

Les policies Row Level Security de Supabase existent pour la quasi-totalité
des tables (36 sur 37) et sont bien écrites. **Elles ne protègent rien
aujourd'hui** : l'application entière lit et écrit via un client Supabase
avec la clé `service_role` (`createAdminClient()`), qui bypasse RLS par
construction. La sécurité réelle repose entièrement sur la couche
applicative (`requireAuth`, `resolveEstablishmentId`,
`assertEstablishmentOwnership`).

C'est un choix assumé pour l'instant, pas un oubli — ce document explique
pourquoi, et ce qu'il faudrait faire pour changer ça proprement plus tard.

> **Mise à jour** : en générant les types Supabase depuis le schéma réel
> (`npx supabase gen types typescript`), on a découvert que les migrations
> 003, 004 et 005 n'étaient en fait **jamais parties en production**
> (`supabase migration list` montrait `remote: ""` pour les trois) — la table
> `news_posts` n'existait pas, les triggers de synchronisation stock/
> bibliothèque non plus. Consolidées et appliquées via
> `supabase/migrations/006_consolidated_pending_migrations.sql`. Les policies
> RLS décrites ci-dessous sont donc maintenant réellement en place (36/37
> tables) — ça ne change rien à la conclusion de ce document (elles restent
> inertes faute de session Supabase Auth réelle), mais l'écart entre "le
> fichier de migration dit X" et "la prod fait X" est désormais comblé.

## Ce qui existe côté base de données

`supabase/migrations/001_core_schema.sql` et
`003_rls_fixes_triggers_functions.sql` activent RLS sur la quasi-totalité des
tables et définissent des policies basées sur deux fonctions :

- `public.current_establishment_id()` — lit `establishment_id` depuis la ligne
  `users` correspondant à `auth.uid()`.
- `public.is_super_admin()` — vérifie si `auth.uid()` a le rôle `super_admin`.

Le pattern type : `USING (establishment_id = current_establishment_id() OR is_super_admin())`.
C'est cohérent avec le modèle multi-tenant de l'app — si ces policies étaient
réellement exercées, elles referaient à peu près (en plus grossier, sans la
granularité par action) ce que fait `resolveEstablishmentId()` côté serveur.

## Pourquoi elles sont inertes

`auth.uid()` et les fonctions ci-dessus ne fonctionnent que si la requête
Postgres/PostgREST porte un JWT Supabase Auth valide. Or l'authentification de
l'app passe entièrement par **NextAuth** ([lib/auth/config.ts](../src/lib/auth/config.ts)) :

- Le provider Credentials appelle `signInWithPassword` uniquement pour
  *vérifier* le mot de passe (voir `authorize()`), sur un client Supabase
  jetable (`persistSession: false`).
- La session réelle de l'utilisateur est un **JWT NextAuth** (cookie signé par
  `AUTH_SECRET`), complètement indépendant du système d'auth de Supabase.
- Le client Supabase anon-key côté navigateur
  ([lib/supabase/client.ts](../src/lib/supabase/client.ts)) n'a donc jamais de
  session Supabase Auth associée → `auth.uid()` y est toujours `NULL`.
- Toutes les Server Actions utilisent `createAdminClient()`
  ([lib/supabase/server.ts](../src/lib/supabase/server.ts)), qui s'authentifie
  avec `SUPABASE_SERVICE_ROLE_KEY` — cette clé bypasse RLS *par design*, quel
  que soit l'état de `auth.uid()`.

Résultat : même si les policies étaient parfaites, aucune requête de l'app ne
les traverse jamais.

## Ce qui protège réellement les données aujourd'hui

La couche applicative, auditée et corrigée en profondeur (voir
`PRODUCTION_CHECKLIST.md` point 4, vérifié par test E2E réel avec deux
établissements isolés) :

- **`requireAuth(action)`** dans chaque `features/*/actions.ts` — vérifie la
  session NextAuth + la permission `module:action` via `hasPermission()`
  ([types/permissions.ts](../src/types/permissions.ts)).
- **`resolveEstablishmentId()`** ([lib/auth/active-etab.ts](../src/lib/auth/active-etab.ts)) —
  verrouille les rôles non-owner/non-super_admin sur leur propre
  établissement ; vérifie l'appartenance réelle via `establishment_owners`
  pour les owners.
- **`assertEstablishmentOwnership()`** (même fichier) — pour les mutations
  par id (update/delete), vérifie que la ligne ciblée appartient bien à
  l'établissement de l'appelant avant d'agir.

C'est plus granulaire que ce que RLS offrirait seul : RLS ne connaît que
l'appartenance à l'établissement, pas les règles fines comme "seuls
comptable et secrétaire peuvent créer un paiement".

## Ce qu'il faudrait pour bridger proprement (pas engagé, pour référence)

Deux options, aucune triviale — les deux retouchent les ~20 fichiers
`features/*/actions.ts` (remplacer `createAdminClient()` par un client scopé
à l'utilisateur) et méritent leur propre suite de tests avant d'être
tentées :

1. **Migrer vers les sessions Supabase Auth** — abandonner ou envelopper
   NextAuth, faire porter la session par Supabase Auth directement. Le plus
   propre à terme, le plus gros chantier.
2. **Pont JWT** — signer un JWT compatible Supabase (mêmes claims `sub`,
   `role`, `aud`, signé avec `SUPABASE_JWT_SECRET`, déjà présent dans
   `.env.local`) au moment où NextAuth établit sa session, puis l'utiliser
   comme bearer token pour un client Supabase scopé. Garde NextAuth comme
   système d'auth principal, RLS devient une vraie deuxième ligne de défense
   plutôt qu'un decor.

Dans les deux cas : le service role resterait nécessaire pour les opérations
admin (`auth.admin.createUser`, etc.), mais le CRUD courant passerait par un
client respectant RLS — changement transverse à valider avec une suite de
tests d'intégration couvrant chaque module avant d'être basculé en
production.
