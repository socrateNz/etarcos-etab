-- ==================================================
-- Etarcos Etab – Seed Data
-- ==================================================

-- 1. Insert Default Permissions
-- We generate permissions for our modules and typical actions: view, create, edit, delete, export, print, approve
INSERT INTO permissions (name, slug, module, action, description) VALUES
  -- Dashboard
  ('Voir le tableau de bord', 'dashboard:view', 'dashboard', 'view', 'Accès général aux statistiques et KPIs de base'),
  
  -- Establishments
  ('Voir les établissements', 'establishments:view', 'establishments', 'view', 'Consulter la liste des établissements'),
  ('Créer un établissement', 'establishments:create', 'establishments', 'create', 'Ajouter un nouvel établissement'),
  ('Modifier un établissement', 'establishments:edit', 'establishments', 'edit', 'Mettre à jour les informations de l''établissement'),
  ('Supprimer un établissement', 'establishments:delete', 'establishments', 'delete', 'Supprimer un établissement'),

  -- Students
  ('Voir les élèves', 'students:view', 'students', 'view', 'Consulter la liste et les détails des élèves'),
  ('Inscrire un élève', 'students:create', 'students', 'create', 'Créer de nouvelles fiches d''élèves'),
  ('Modifier un élève', 'students:edit', 'students', 'edit', 'Mettre à jour le dossier d''un élève'),
  ('Supprimer un élève', 'students:delete', 'students', 'delete', 'Supprimer la fiche d''un élève'),

  -- Payments
  ('Voir les paiements', 'payments:view', 'payments', 'view', 'Consulter les états de paiement et les factures'),
  ('Enregistrer un paiement', 'payments:create', 'payments', 'create', 'Enregistrer un nouveau règlement de frais'),
  ('Modifier un paiement', 'payments:edit', 'payments', 'edit', 'Modifier les informations d''un paiement'),
  ('Approuver un paiement', 'payments:approve', 'payments', 'approve', 'Valider un règlement en attente (chèque/virement)'),

  -- Grades
  ('Voir les notes', 'grades:view', 'grades', 'view', 'Consulter le relevé de notes'),
  ('Saisir des notes', 'grades:create', 'grades', 'create', 'Enregistrer les notes d''une évaluation'),
  ('Modifier des notes', 'grades:edit', 'grades', 'edit', 'Mettre à jour les notes'),

  -- Report Cards
  ('Voir les bulletins', 'report_cards:view', 'report_cards', 'view', 'Consulter les bulletins scolaires'),
  ('Générer des bulletins', 'report_cards:create', 'report_cards', 'create', 'Lancer les calculs et la génération des bulletins'),
  ('Signer et publier', 'report_cards:approve', 'report_cards', 'approve', 'Signer électroniquement et publier les bulletins aux parents'),
  ('Imprimer les bulletins', 'report_cards:print', 'report_cards', 'print', 'Télécharger et imprimer les bulletins physiques')
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Default System Roles
-- Super Admin (global platform admin, not bound to single establishment)
INSERT INTO roles (name, slug, description, is_system, color) VALUES
  ('Super Administrateur', 'super_admin', 'Accès complet et sans restriction à toute la plateforme', TRUE, '#ef4444'),
  ('Propriétaire', 'owner', 'Propriétaire de l''établissement avec accès administratif global', TRUE, '#f59e0b'),
  ('Directeur', 'director', 'Directeur d''établissement, gestion opérationnelle totale', TRUE, '#8b5cf6'),
  ('Censeur', 'censor', 'Directeur des études et de la discipline académique', TRUE, '#6366f1'),
  ('Comptable', 'accountant', 'Gestion financière et comptabilité de l''établissement', TRUE, '#06b6d4'),
  ('Enseignant', 'teacher', 'Accès aux classes attribuées, saisie des notes et présences', TRUE, '#22c55e'),
  ('Secrétaire', 'secretary', 'Gestion des inscriptions et secrétariat administratif', TRUE, '#84cc16'),
  ('Bibliothécaire', 'librarian', 'Gestion de la bibliothèque et emprunts de livres', TRUE, '#a855f7'),
  ('Responsable Labo', 'lab_manager', 'Gestion de l''inventaire des équipements et laboratoires', TRUE, '#f97316'),
  ('Parent', 'parent', 'Accès aux dossiers, notes et états financiers de ses enfants', TRUE, '#64748b'),
  ('Élève', 'student', 'Accès à son emploi du temps, ses notes et sa bibliothèque', TRUE, '#94a3b8')
ON CONFLICT (slug, establishment_id) DO NOTHING;

-- 3. Associate Permissions to System Roles
-- Let's assign some default permissions for roles.
-- For demo purposes: owner role gets all core permissions
DO $$
DECLARE
  role_id_var UUID;
  perm_id_var UUID;
BEGIN
  -- Get Owner Role
  SELECT id INTO role_id_var FROM roles WHERE slug = 'owner' AND establishment_id IS NULL;
  
  IF role_id_var IS NOT NULL THEN
    -- Assign all current permissions to Owner
    FOR perm_id_var IN SELECT id FROM permissions LOOP
      INSERT INTO role_permissions (role_id, permission_id) 
      VALUES (role_id_var, perm_id_var)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  
  -- Get Teacher Role
  SELECT id INTO role_id_var FROM roles WHERE slug = 'teacher' AND establishment_id IS NULL;
  IF role_id_var IS NOT NULL THEN
    -- Assign view dashboard, view students, view/create/edit grades
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT role_id_var, id FROM permissions 
    WHERE slug IN ('dashboard:view', 'students:view', 'grades:view', 'grades:create', 'grades:edit')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Get Student Role
  SELECT id INTO role_id_var FROM roles WHERE slug = 'student' AND establishment_id IS NULL;
  IF role_id_var IS NOT NULL THEN
    -- Assign view dashboard, view grades, view report cards
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT role_id_var, id FROM permissions 
    WHERE slug IN ('dashboard:view', 'grades:view', 'report_cards:view')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
