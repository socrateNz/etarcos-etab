"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULES } from "@/config/modules";

// Map des labels de segments
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  students: "Élèves",
  parents: "Parents",
  classes: "Classes",
  subjects: "Matières",
  timetables: "Emplois du temps",
  grades: "Notes",
  exams: "Examens",
  "report-cards": "Bulletins",
  payments: "Paiements",
  accounting: "Comptabilité",
  expenses: "Dépenses",
  revenues: "Recettes",
  staff: "Personnel",
  hr: "Ressources Humaines",
  rooms: "Salles",
  documents: "Documents",
  diplomas: "Diplômes",
  library: "Bibliothèque",
  inventory: "Inventaire",
  reports: "Rapports",
  settings: "Paramètres",
  establishments: "Établissements",
  users: "Utilisateurs",
  owners: "Propriétaires",
  cycles: "Cycles",
  attendance: "Présences",
  discipline: "Discipline",
  "ai-assistant": "Assistant IA",
  new: "Nouveau",
  edit: "Modifier",
  profile: "Profil",
};

function getSegmentLabel(segment: string): string {
  // Check if it's a UUID (detail page)
  if (/^[0-9a-f-]{36}$/.test(segment)) return "Détails";
  return SEGMENT_LABELS[segment] ?? segment;
}

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}

export function Breadcrumb() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  const items: BreadcrumbItem[] = [
    { label: "Accueil", href: "/dashboard", isLast: segments.length === 0 },
    ...segments.map((segment, index) => ({
      label: getSegmentLabel(segment),
      href: `/${segments.slice(0, index + 1).join("/")}`,
      isLast: index === segments.length - 1,
    })),
  ];

  if (items.length <= 1) return null;

  return (
    <nav aria-label="Fil d'ariane" className="flex items-center gap-1 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index === 0 ? (
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-1 transition-colors",
                item.isLast
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ) : (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
              {item.isLast ? (
                <span className="text-foreground font-medium capitalize">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors capitalize"
                >
                  {item.label}
                </Link>
              )}
            </>
          )}
        </div>
      ))}
    </nav>
  );
}
