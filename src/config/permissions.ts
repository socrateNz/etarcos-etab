import { ROLE_PERMISSIONS, hasPermission, getPermissionsForRole, canAccess } from "@/types/permissions";
import { SystemRole } from "@/types/auth";
import { ModuleKey, ActionKey } from "@/types/permissions";

export { ROLE_PERMISSIONS, hasPermission, getPermissionsForRole, canAccess };

export interface PermissionDetail {
  slug: string;
  name: string;
  module: ModuleKey;
  action: ActionKey;
  description: string;
}

export const ALL_PERMISSION_DETAILS: PermissionDetail[] = [
  // Dashboard
  { slug: "dashboard:view", name: "Voir le tableau de bord", module: "dashboard", action: "view", description: "Accès à la page d'accueil et indicateurs" },

  // Establishments
  { slug: "establishments:view", name: "Voir les établissements", module: "establishments", action: "view", description: "Consulter les informations de l'établissement" },
  { slug: "establishments:create", name: "Créer un établissement", module: "establishments", action: "create", description: "Ajouter de nouveaux établissements" },
  { slug: "establishments:edit", name: "Modifier l'établissement", module: "establishments", action: "edit", description: "Modifier les coordonnées et paramètres" },
  { slug: "establishments:delete", name: "Supprimer l'établissement", module: "establishments", action: "delete", description: "Supprimer définitivement l'établissement" },

  // Students
  { slug: "students:view", name: "Voir les élèves", module: "students", action: "view", description: "Consulter la liste et les dossiers élèves" },
  { slug: "students:create", name: "Inscrire un élève", module: "students", action: "create", description: "Ajouter des élèves à l'établissement" },
  { slug: "students:edit", name: "Modifier un élève", module: "students", action: "edit", description: "Mettre à jour le dossier d'un élève" },
  { slug: "students:delete", name: "Supprimer un élève", module: "students", action: "delete", description: "Retirer un élève de l'établissement" },

  // Payments
  { slug: "payments:view", name: "Voir les paiements", module: "payments", action: "view", description: "Consulter l'historique et les reçus de scolarité" },
  { slug: "payments:create", name: "Enregistrer un paiement", module: "payments", action: "create", description: "Saisir un versement de frais scolaires" },
  { slug: "payments:approve", name: "Approuver un paiement", module: "payments", action: "approve", description: "Valider les virements ou chèques reçus" },

  // Grades
  { slug: "grades:view", name: "Voir les notes", module: "grades", action: "view", description: "Consulter les notes scolaires" },
  { slug: "grades:create", name: "Saisir des notes", module: "grades", action: "create", description: "Ajouter des notes aux évaluations" },
  { slug: "grades:edit", name: "Modifier des notes", module: "grades", action: "edit", description: "Mettre à jour des notes d'évaluation" },

  // Tracks (Filières)
  { slug: "tracks:view", name: "Voir les filières", module: "tracks", action: "view", description: "Consulter les filières et spécialités" },
  { slug: "tracks:create", name: "Créer une filière", module: "tracks", action: "create", description: "Ajouter une nouvelle filière" },
  { slug: "tracks:edit", name: "Modifier une filière", module: "tracks", action: "edit", description: "Mettre à jour une filière existante" },
  { slug: "tracks:delete", name: "Supprimer une filière", module: "tracks", action: "delete", description: "Supprimer une filière" },
  // Cycles
  { slug: "cycles:view", name: "Voir les cycles", module: "cycles", action: "view", description: "Consulter cycles et niveaux" },
  { slug: "cycles:create", name: "Créer cycles/niveaux", module: "cycles", action: "create", description: "Ajouter cycles et niveaux" },
  { slug: "cycles:edit", name: "Modifier cycles/niveaux", module: "cycles", action: "edit", description: "Mettre à jour la structure académique" },
  { slug: "cycles:delete", name: "Supprimer cycles/niveaux", module: "cycles", action: "delete", description: "Supprimer cycles ou niveaux" },
  // News
  { slug: "news:view", name: "Voir les actualités", module: "news", action: "view", description: "Consulter les actualités et annonces" },
  { slug: "news:create", name: "Créer une actualité", module: "news", action: "create", description: "Publier une nouvelle annonce" },
  { slug: "news:edit", name: "Modifier une actualité", module: "news", action: "edit", description: "Mettre à jour une annonce" },
  { slug: "news:delete", name: "Supprimer une actualité", module: "news", action: "delete", description: "Supprimer une annonce" },
];
