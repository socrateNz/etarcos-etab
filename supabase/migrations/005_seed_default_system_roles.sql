-- Migration: Insertion des rôles système par défaut dans la table public.roles

INSERT INTO public.roles (name, slug, description, is_system)
SELECT 'Super Administrateur', 'super_admin', 'Accès complet à la plateforme SaaS', true
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE slug = 'super_admin');

INSERT INTO public.roles (name, slug, description, is_system)
SELECT 'Propriétaire', 'owner', 'Propriétaire de la structure ou du groupe scolaire', true
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE slug = 'owner');

INSERT INTO public.roles (name, slug, description, is_system)
SELECT 'Directeur d''Établissement', 'director', 'Directeur opérationnel et pédagogique d''un établissement', true
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE slug = 'director');

INSERT INTO public.roles (name, slug, description, is_system)
SELECT 'Censeur / Surveillant Général', 'censor', 'Censeur et responsable de la discipline', true
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE slug = 'censor');

INSERT INTO public.roles (name, slug, description, is_system)
SELECT 'Comptable / Gestionnaire', 'accountant', 'Gestionnaire financier et comptable', true
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE slug = 'accountant');

INSERT INTO public.roles (name, slug, description, is_system)
SELECT 'Enseignant', 'teacher', 'Professeur et corps enseignant', true
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE slug = 'teacher');

INSERT INTO public.roles (name, slug, description, is_system)
SELECT 'Secrétaire', 'secretary', 'Secrétaire administratif', true
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE slug = 'secretary');

INSERT INTO public.roles (name, slug, description, is_system)
SELECT 'Bibliothécaire', 'librarian', 'Gestionnaire de la bibliothèque', true
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE slug = 'librarian');

INSERT INTO public.roles (name, slug, description, is_system)
SELECT 'Responsable Laboratoire', 'lab_manager', 'Responsable du matériel de laboratoire', true
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE slug = 'lab_manager');

INSERT INTO public.roles (name, slug, description, is_system)
SELECT 'Élève', 'student', 'Élève / Apprenant', true
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE slug = 'student');

INSERT INTO public.roles (name, slug, description, is_system)
SELECT 'Parent', 'parent', 'Parent d''élève / Tuteur', true
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE slug = 'parent');
