# Checklist avant mise en production

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

## 4. Test manuel en conditions réelles — À FAIRE PAR VOUS

**Je n'ai pas pu le faire moi-même** : cette machine n'a actuellement pas d'accès réseau sortant vers votre projet Supabase ni vers les CDN externes (timeouts de connexion confirmés sur les deux, y compris hors sandbox). Ce n'est pas un problème de code — le serveur de dev démarre correctement et le build de production passe intégralement ; c'est l'environnement réseau de cette session qui bloque les appels externes.

**Avant d'ouvrir à de vrais utilisateurs**, sur une machine avec un accès réseau normal, lancez `npm run dev` et vérifiez :

- [ ] Connexion avec un compte existant de chaque rôle clé (director, teacher, parent au minimum)
- [ ] `/students` : créer un élève → l'email de bienvenue arrive (si SMTP configuré) → le mot de passe temporaire fonctionne pour se connecter
- [ ] `/payments` : enregistrer un paiement, vérifier que le statut (payé/partiel) est correct
- [ ] `/grades` : saisir des notes, vérifier que la moyenne de classe s'affiche (elle était cassée avant cette session — colonne `score` inexistante corrigée en `value`)
- [ ] `/documents` : téléverser un vrai fichier, vérifier qu'il apparaît dans la liste et que le téléchargement fonctionne
- [ ] `/diplomas` : émettre un diplôme pour un élève, vérifier l'impression
- [ ] Se connecter avec deux comptes de **deux établissements différents** et confirmer qu'aucun ne voit les données de l'autre (c'était le bug principal corrigé cette session)
- [ ] Onglet réseau du navigateur : aucune erreur 500 silencieuse sur les pages ci-dessus

Une fois cette checklist validée, cochez le point 4 comme fait.
