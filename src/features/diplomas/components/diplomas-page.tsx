"use client";

import { useState } from "react";
import { Award, Plus, Search, Printer, Trash2, Hash } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { useDiplomas, useCreateDiploma, useDeleteDiploma } from "../hooks/use-diplomas";
import { DiplomaFormDialog } from "./diploma-form-dialog";
import type { CreateDiplomaInput } from "../schemas";
import type { Diploma } from "../types";

function printDiploma(diploma: Diploma) {
  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) return;
  const studentName = diploma.student?.user?.name ?? "—";
  win.document.write(`
    <html>
      <head>
        <title>${diploma.name} — ${studentName}</title>
        <style>
          body { font-family: Georgia, serif; text-align: center; padding: 80px 40px; }
          h1 { font-size: 14px; letter-spacing: 3px; text-transform: uppercase; color: #666; }
          h2 { font-size: 32px; margin: 24px 0 8px; }
          .student { font-size: 22px; margin: 24px 0; font-weight: bold; }
          .meta { margin-top: 40px; font-size: 13px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Certificat</h1>
        <h2>${diploma.name}</h2>
        <p>Décerné à</p>
        <p class="student">${studentName}</p>
        <p class="meta">
          N° de série : ${diploma.serial_number}<br />
          Délivré le ${formatDate(diploma.issue_date)}
        </p>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

export function DiplomasPage() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useDiplomas({ search: search || undefined });
  const createDiploma = useCreateDiploma();
  const deleteDiploma = useDeleteDiploma();

  const diplomas = data?.data ?? [];

  const handleCreate = async (values: CreateDiplomaInput) => {
    const result = await createDiploma.mutateAsync(values);
    if (!result.error) setCreateOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDiploma.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diplômes & Attestations"
        description="Registre des diplômes délivrés par l'établissement"
        icon={Award}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Émettre un diplôme
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par élève, diplôme ou n° de série..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <ErrorState message="Impossible de charger les diplômes." />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : diplomas.length === 0 ? (
        <Card className="text-center py-16">
          <Award className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <h3 className="font-semibold text-lg">Aucun diplôme émis</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {search ? "Aucun résultat pour cette recherche." : "Émettez le premier diplôme pour un élève."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {diplomas.map((dip) => (
            <Card key={dip.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {dip.student?.classroom?.name || "Sans classe"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(dip.issue_date)}</span>
                </div>
                <CardTitle className="text-base font-bold line-clamp-2">{dip.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{dip.student?.user?.name ?? "Élève inconnu"}</p>
              </CardHeader>

              <CardContent className="py-0">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {dip.serial_number}
                </p>
              </CardContent>

              <CardFooter className="pt-4 border-t mt-4 flex items-center justify-end gap-1">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => printDiploma(dip)}>
                  <Printer className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(dip.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <DiplomaFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isLoading={createDiploma.isPending}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer ce diplôme ?"
        description="Cette entrée sera définitivement retirée du registre. Cette action ne révoque pas un diplôme officiellement délivré — assurez-vous qu'il s'agit bien d'une erreur de saisie."
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteDiploma.isPending}
      />
    </div>
  );
}
