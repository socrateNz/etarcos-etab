"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SYSTEM_ROLES, type SystemRole } from "@/types/auth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Crown, Building, GraduationCap, PenTool, CreditCard,
  UserCheck, Package, Users, FileText, CheckCircle2, ArrowRight,
  Sparkles, Lightbulb, ShieldCheck, HelpCircle
} from "lucide-react";
import Link from "next/link";

interface GuideStep {
  title: string;
  description: string;
  link?: { label: string; path: string };
}

interface RoleGuideContent {
  title: string;
  badge: string;
  icon: any;
  color: string;
  description: string;
  objective: string;
  steps: GuideStep[];
  proTips: string[];
}

const ROLE_GUIDES: Record<string, RoleGuideContent> = {
  super_admin: {
    title: "Super Administrateur & Promoteur",
    badge: "Accès Total",
    icon: Crown,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    description: "Guide pour le pilotage global du réseau d'établissements et la gestion des droits.",
    objective: "Superviser les performances globales, configurer les comptes privilégiés et gérer les abonnements.",
    steps: [
      { title: "1. Gestion des Établissements", description: "Créez et configurez vos écoles dans le module Établissements. Définissez les informations officielles (logo, proviseur).", link: { label: "Voir les Établissements", path: "/establishments" } },
      { title: "2. Attribution des Accès & Rôles", description: "Invitez les directeurs, économes et censeurs. Attribuez-leur des rôles RBAC stricts pour sécuriser les données.", link: { label: "Gérer les Utilisateurs", path: "/users" } },
      { title: "3. Supervision Financière & Rapports", description: "Consultez le chiffre d'affaires consolidé, les frais encaissés et le taux de recouvrement global.", link: { label: "Tableau de Bord", path: "/dashboard" } },
    ],
    proTips: [
      "Basculez entre le mode 'Vue Globale' et un établissement spécifique via le sélecteur situé dans la barre supérieure.",
      "Utilisez le raccourci Ctrl+K pour rechercher n'importe quel dossier utilisateur ou reçu de caisse en moins d'une seconde.",
    ],
  },
  owner: {
    title: "Propriétaire d'Établissements",
    badge: "Vue Globale",
    icon: Building,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    description: "Guide dédié aux fondateurs et propriétaires de groupes scolaires.",
    objective: "Suivre la rentabilité, l'évolution des effectifs et l'assiduité globale des équipes.",
    steps: [
      { title: "1. Analyse des Recettes", description: "Suivez en temps réel l'encaissement des tranches de scolarité et les impayés par niveau.", link: { label: "Paiements", path: "/payments" } },
      { title: "2. Suivi des Effectifs", description: "Consultez la répartition des élèves par classe, filière et cycle d'enseignement.", link: { label: "Classes", path: "/classes" } },
      { title: "3. Rapports & Statistiques", description: "Générez des synthèses d'activité exportables en Excel et PDF pour vos réunions du conseil d'administration.", link: { label: "Statistiques", path: "/reports" } },
    ],
    proTips: [
      "Configurez les rappels automatiques pour informer les parents des dates d'échéances de scolarité.",
    ],
  },
  director: {
    title: "Directeur / Proviseur",
    badge: "Gestion Pédagogique",
    icon: GraduationCap,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    description: "Guide pour le pilotage pédagogique, la validation des bulletins et la discipline.",
    objective: "Assurer le bon déroulement de l'année scolaire, valider les résultats et superviser le personnel.",
    steps: [
      { title: "1. Structuration Académique", description: "Définissez l'année académique active, les filières, cycles et coefficients des matières.", link: { label: "Matières & Programmes", path: "/subjects" } },
      { title: "2. Attribution des Titulaires", description: "Associez chaque professeur principal à sa classe physique et paramétrez la capacité des salles.", link: { label: "Gestion des Classes", path: "/classes" } },
      { title: "3. Validation des Bulletins Trimestriels", description: "Consultez le calcul automatique des moyennes générales, rangs et mentions, puis imprimez les bulletins en lot.", link: { label: "Bulletins de Notes", path: "/report-cards" } },
    ],
    proTips: [
      "Vous pouvez imprimer l'ensemble des bulletins d'une classe entière en un seul clic grâce au bouton 'Imprimer toute la classe'.",
    ],
  },
  censor: {
    title: "Censeur des Études / Préfet",
    badge: "Notes & Emplois du Temps",
    icon: PenTool,
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    description: "Guide pour le suivi de la saisie des notes, emplois du temps et présences.",
    objective: "Superviser les évaluations, contrôler l'assiduité des élèves et préparer les conseils de classe.",
    steps: [
      { title: "1. Planning & Emplois du temps", description: "Configurez la grille horaire et les créneaux de cours par classe et enseignant.", link: { label: "Emplois du Temps", path: "/timetables" } },
      { title: "2. Suivi de la Saisie des Notes", description: "Vérifiez que les professeurs ont renseigné leurs évaluations (Devoirs, Évaluations, Examens).", link: { label: "Saisie des Notes", path: "/grades" } },
      { title: "3. Contrôle des Absences", description: "Consultez le bilan des heures d'absence par élève et enregistrez les justificatifs.", link: { label: "Registre de Présence", path: "/attendance" } },
    ],
    proTips: [
      "Utilisez le filtre par trimestre T1 / T2 / T3 pour vérifier les taux de saisie des enseignants avant la fermeture des notes.",
    ],
  },
  accountant: {
    title: "Comptable & Économe",
    badge: "Finances & Caisse",
    icon: CreditCard,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    description: "Guide pour le traitement de la caisse, des factures et des encaissements.",
    objective: "Enregistrer les versements de scolarité, délivrer les reçus officiels et gérer la comptabilité.",
    steps: [
      { title: "1. Enregistrement d'un Paiement", description: "Recherchez l'élève, saisissez le montant encaissé (Espèces, Chèque, Mobile Money) et attribuez le frais.", link: { label: "Encaissements", path: "/payments" } },
      { title: "2. Impression du Reçu Officiel", description: "Cliquez sur 'Voir le reçu' et imprimez immédiatement le billet de caisse officiel tamponné.", link: { label: "Reçus de Caisse", path: "/payments" } },
      { title: "3. Suivi des Dépenses", description: "Enregistrez les charges courantes de l'établissement (Fournitures, factures d'électricité, réparations).", link: { label: "Dépenses", path: "/expenses" } },
    ],
    proTips: [
      "Pour chaque reçu imprimé, la mention du reste à payer est calculée et mise à jour automatiquement.",
    ],
  },
  secretary: {
    title: "Secrétaire Administratif(ve)",
    badge: "Inscriptions & Accueil",
    icon: UserCheck,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    description: "Guide pour l'accueil, les inscriptions et la gestion des dossiers scolaires.",
    objective: "Gérer l'admission des nouveaux élèves, éditer les documents officiels et mettre à jour le répertoire.",
    steps: [
      { title: "1. Inscription d'un Élève", description: "Saisissez les informations personnelles de l'élève, attribuez le matricule et sélectionnez sa classe.", link: { label: "Répertoire des Élèves", path: "/students" } },
      { title: "2. Raccordement des Parents", description: "Associez les tuteurs légaux (Père, Mère, Tuteur) avec leurs numéros de téléphone pour les notifications.", link: { label: "Parents d'Élèves", path: "/parents" } },
      { title: "3. Émission de Documents", description: "Générez les certificats de scolarité, cartes scolaires et fiches d'inscription.", link: { label: "Documents", path: "/documents" } },
    ],
    proTips: [
      "Recherchez un élève en un clin d'œil en tapant simplement son matricule dans la barre de recherche globale.",
    ],
  },
  teacher: {
    title: "Enseignant / Professeur",
    badge: "Espace Enseignant",
    icon: BookOpen,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    description: "Guide pour la saisie des évaluations et la gestion quotidienne des classes.",
    objective: "Saisir les notes des devoirs, faire l'appel des présences et rédiger les appréciations.",
    steps: [
      { title: "1. Saisie de la Grille de Notes", description: "Sélectionnez votre classe et votre matière, puis renseignez la note obtenue par chaque élève.", link: { label: "Saisir des Notes", path: "/grades" } },
      { title: "2. Relevé d'Absences", description: "Faites l'appel au début de chaque heure de cours et marquez les absents ou retardataires.", link: { label: "Feuille de Présence", path: "/attendance" } },
      { title: "3. Consultations des Bulletins", description: "Consultez le rang et les performances de vos élèves pour adapter votre pédagogie.", link: { label: "Bulletins", path: "/report-cards" } },
    ],
    proTips: [
      "Toutes les notes saisies calculent la moyenne de l'élève automatiquement en fonction du coefficient de votre matière.",
    ],
  },
  lab_manager: {
    title: "Gestionnaire de Matériel & Stock",
    badge: "Inventaire",
    icon: Package,
    color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
    description: "Guide pour le suivi des équipements, consommables et fournitures.",
    objective: "Maintenir l'inventaire à jour, suivre les mouvements et anticiper les réapprovisionnements.",
    steps: [
      { title: "1. Répertoire des Articles", description: "Consultez la liste des consommables (rames, marqueurs, réactifs) et équipements enregistrés.", link: { label: "Voir l'Inventaire", path: "/inventory" } },
      { title: "2. Mouvements de Stock", description: "Enregistrez les entrées (achats) et sorties (dotations de professeurs, consommations).", link: { label: "Créer un Mouvement", path: "/inventory" } },
      { title: "3. Alertes Stock Faible", description: "Filtrez en un clic les articles en sous-effectif (≤ 5 unités) pour passer commande.", link: { label: "Alertes Stock", path: "/inventory" } },
    ],
    proTips: [
      "Cliquez sur la carte 'Stock Faible' du tableau de bord d'inventaire pour afficher directement les articles en rupture imminent.",
    ],
  },
  student: {
    title: "Élève & Parent d'Élève",
    badge: "Espace Famille",
    icon: Users,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    description: "Guide pour la consultation des notes, bulletins et règlements de scolarité.",
    objective: "Suivre la scolarité de l'enfant, consulter les notes et télécharger les bulletins imprimables.",
    steps: [
      { title: "1. Consultation du Bulletin", description: "Consultez les notes par matière, le rang de l'élève et la décision du conseil de classe.", link: { label: "Consulter mon Bulletin", path: "/report-cards" } },
      { title: "2. Suivi de la Scolarité", description: "Vérifiez l'historique des tranches de paiement et les reçus de caisse délivrés.", link: { label: "Paiements", path: "/payments" } },
      { title: "3. Assiduité & Absences", description: "Consultez le relevé des absences et retards enregistrés par les enseignants.", link: { label: "Absences", path: "/attendance" } },
    ],
    proTips: [
      "Le bulletin affiché peut être directement imprimé au format officiel en cliquant sur 'Imprimer le bulletin'.",
    ],
  },
};

export function UserGuideView() {
  const { user } = useAuth();
  const currentRole = user?.role || "director";
  const [selectedRole, setSelectedRole] = useState<string>(currentRole);

  // Synchronize with logged-in user role when component mounts or user updates
  useEffect(() => {
    if (user?.role) {
      setSelectedRole(user.role);
    }
  }, [user?.role]);

  const guide = ROLE_GUIDES[selectedRole] || ROLE_GUIDES.director;
  const RoleIcon = guide.icon;

  const CREATION_WORKFLOW_STEPS = [
    {
      step: "1",
      title: "Infrastructure & Année Académique",
      creator: "SuperAdmin / Promoteur",
      roles: ["super_admin", "owner"],
      badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      items: ["1. Créer l'Établissement", "2. Configurer l'Année Académique active (ex: 2025-2026)", "3. Créer le compte du Directeur et du Comptable"],
      link: { label: "Établissements", path: "/establishments" },
    },
    {
      step: "2",
      title: "Structure Pédagogique & Programme",
      creator: "Directeur / Proviseur",
      roles: ["super_admin", "owner", "director"],
      badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      items: ["1. Créer les Cycles et Niveaux (6ème... Tle)", "2. Enregistrer les Filières (Série C, D, A4)", "3. Définir les Matières et leurs coefficients"],
      link: { label: "Matières & Programme", path: "/subjects" },
    },
    {
      step: "3",
      title: "Personnel, Salles & Classes",
      creator: "Directeur & Censeur",
      roles: ["super_admin", "owner", "director", "censor"],
      badgeColor: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      items: ["1. Créer les comptes Enseignants", "2. Enregistrer les Salles physiques", "3. Créer les Classes et attribuer les Professeurs Principaux"],
      link: { label: "Classes & Salles", path: "/classes" },
    },
    {
      step: "4",
      title: "Inscriptions Élèves & Scolarité",
      creator: "Secrétaire & Économe",
      roles: ["super_admin", "owner", "director", "secretary", "accountant"],
      badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      items: ["1. Créer les Fiches Tuteurs / Parents", "2. Inscrire l'Élève avec son Matricule et l'affecter à sa Classe", "3. Enregistrer les versments de scolarité et imprimer le Reçu"],
      link: { label: "Élèves & Inscriptions", path: "/students" },
    },
    {
      step: "5",
      title: "Planning, Absences & Saisie des Notes",
      creator: "Censeur & Enseignants",
      roles: ["super_admin", "owner", "director", "censor", "teacher"],
      badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      items: ["1. Générer l'Emploi du Temps par classe et enseignant", "2. Renseigner le Registre d'Absences", "3. Saisir les notes d'évaluations par matière et période (T1, T2, T3)"],
      link: { label: "Saisie des Notes", path: "/grades" },
    },
    {
      step: "6",
      title: "Calcul & Impression des Bulletins",
      creator: "Système (Calcul) & Directeur (Édition)",
      roles: ["super_admin", "owner", "director", "censor", "student", "parent"],
      badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      items: ["1. Le système calcule les moyennes, rangs et mentions automatiquement", "2. Consulter le bulletin trimestriel récapitulatif", "3. Lancer l'Impression Groupée de toute la classe"],
      link: { label: "Bulletins de Notes", path: "/report-cards" },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Role Switcher Selector Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-sm p-4 rounded-xl border border-border/60">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Manuel d'Utilisation interactif
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connecté en tant que <strong className="text-primary">{user?.name || "Utilisateur"}</strong> ({guide.title}). Le guide s'adapte automatiquement à votre rôle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Filtrer par rôle :</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {Object.entries(ROLE_GUIDES).map(([roleKey, g]) => (
              <option key={roleKey} value={roleKey}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Role Header Banner */}
      <Card className="border-border/60 bg-gradient-to-r from-card via-card/80 to-muted/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-2xl border ${guide.color}`}>
                <RoleIcon className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">{guide.title}</h3>
                  <Badge variant="outline" className="text-xs font-medium">
                    {guide.badge}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{guide.description}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span><strong>Objectif principal :</strong> {guide.objective}</span>
          </div>
        </CardContent>
      </Card>

      {/* Step by Step Guide Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" /> Étapes clés pour {guide.title}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {guide.steps.map((step, idx) => (
            <Card key={idx} className="border-border/50 bg-card/40 hover:border-primary/30 transition-all flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-muted-foreground">
                <p>{step.description}</p>

                {step.link && (
                  <Link
                    href={step.link.path}
                    className="inline-flex items-center justify-between rounded-lg border border-primary/20 bg-background/50 px-3 py-1.5 text-xs font-semibold hover:bg-primary/10 hover:text-foreground transition-all w-full"
                  >
                    <span>{step.link.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-primary" />
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pro Tips Box */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-amber-500 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" /> Conseils & Astuces d'Utilisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {guide.proTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Global System Creation Workflow (Filtered by Role) */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" /> Séquence de Création (Vue : {guide.title})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ordre chronologique des actions et interventions dans le système pour le rôle sélectionné.
          </p>
        </div>

        <div className="space-y-3">
          {CREATION_WORKFLOW_STEPS.filter((item) =>
            item.roles.includes(selectedRole as any)
          ).map((item) => (
            <Card
              key={item.step}
              className="border-border/60 bg-card/90 border-primary/30 shadow-sm transition-all hover:border-primary/50"
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                        <Badge variant="outline" className={`text-[10px] ${item.badgeColor}`}>
                          Créé par : {item.creator}
                        </Badge>
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">
                          Action requise
                        </Badge>
                      </div>
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {item.items.map((sub, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/60" />
                            {sub}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Link
                    href={item.link.path}
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors whitespace-nowrap self-start md:self-center"
                  >
                    {item.link.label} <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-primary" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
