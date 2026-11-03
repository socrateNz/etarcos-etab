import Link from "next/link";
import { ArrowRight, CalendarCheck, CalendarDays, CreditCard, FileText, GraduationCap, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveStudentScope } from "@/lib/auth/active-etab";
import { formatCurrency } from "@/lib/utils";

type Child = {
  id: string;
  student_number: string | null;
  status: string | null;
  user: { name: string | null } | null;
  classroom: { name: string | null } | null;
};

/**
 * Tableau de bord des parents et des élèves : uniquement les élèves de leur
 * périmètre (enfants liés pour un parent, lui-même pour un élève).
 */
export async function FamilyDashboard({ role, establishmentId }: { role: "parent" | "student"; establishmentId: string | null }) {
  const scope = await resolveStudentScope();
  const ids = scope.kind === "ids" ? scope.ids : [];

  let children: Child[] = [];
  let balanceDue = 0;

  if (ids.length > 0 && establishmentId) {
    const db = (await createAdminClient()) as any;
    const [{ data: students }, { data: payments }] = await Promise.all([
      db
        .from("students")
        .select("id, student_number, status, user:users(name), classroom:classrooms(name)")
        .in("id", ids)
        .eq("establishment_id", establishmentId),
      role === "parent"
        ? db
            .from("payments")
            .select("amount, amount_paid, status")
            .in("student_id", ids)
            .eq("establishment_id", establishmentId)
            .neq("status", "paid")
        : Promise.resolve({ data: [] }),
    ]);
    children = (students ?? []) as Child[];
    balanceDue = (payments ?? []).reduce(
      (acc: number, p: any) => acc + Math.max(Number(p.amount || 0) - Number(p.amount_paid || 0), 0),
      0
    );
  }

  const links = [
    { label: "Bulletins", href: "/report-cards", icon: FileText },
    { label: "Notes", href: "/grades", icon: GraduationCap },
    { label: "Présences", href: "/attendance", icon: CalendarCheck },
    { label: "Emploi du temps", href: "/timetables", icon: CalendarDays },
    ...(role === "parent"
      ? [
          { label: "Paiements", href: "/payments", icon: CreditCard },
          { label: "Discipline", href: "/discipline", icon: ShieldAlert },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bienvenue</h1>
        <p className="text-muted-foreground mt-1">
          {role === "parent" ? "Suivi de la scolarité de vos enfants." : "Suivi de votre scolarité."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{role === "parent" ? "Mes enfants" : "Mon dossier"}</CardTitle>
            <CardDescription>Élèves rattachés à votre compte</CardDescription>
          </CardHeader>
          <CardContent>
            {children.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {role === "parent"
                  ? "Aucun élève n'est encore rattaché à votre compte. Contactez le secrétariat de l'établissement."
                  : "Votre dossier élève n'est pas encore rattaché à votre compte. Contactez le secrétariat."}
              </p>
            ) : (
              <div className="divide-y">
                {children.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{c.user?.name || "Élève"}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.classroom?.name ? `Classe ${c.classroom.name}` : "Sans classe"}
                        {c.student_number ? ` · Matricule ${c.student_number}` : ""}
                      </p>
                    </div>
                    {c.status && c.status !== "active" && (
                      <Badge variant="outline" className="text-xs">{c.status}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {role === "parent" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reste à payer</CardTitle>
              <CardDescription>Frais scolaires non soldés</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={balanceDue > 0 ? "text-2xl font-bold text-destructive" : "text-2xl font-bold text-emerald-500"}>
                {formatCurrency(balanceDue)}
              </p>
              <Link href="/payments" className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                Voir le détail <ArrowRight className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accès rapide</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <l.icon className="w-4 h-4 text-primary" />
              {l.label}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
