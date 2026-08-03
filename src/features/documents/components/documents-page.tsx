"use client";

import { useState } from "react";
import { FolderOpen, Plus, Search, Download, Trash2, FileText, Lock, Globe } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { useDocuments, useCreateDocument, useDeleteDocument } from "../hooks/use-documents";
import { DocumentUploadDialog } from "./document-upload-dialog";
import type { CreateDocumentInput } from "../schemas";

const CATEGORY_LABELS: Record<string, string> = {
  report_card: "Bulletin scolaire",
  receipt: "Reçu / Facture",
  contract: "Contrat",
  id_card: "Pièce d'identité",
  other: "Autre",
};

export function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useDocuments({ search: search || undefined });
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();

  const documents = data?.data ?? [];

  const handleUpload = async (values: CreateDocumentInput) => {
    await createDocument.mutateAsync(values);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDocument.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Registre des documents officiels de l'établissement"
        icon={FolderOpen}
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Téléverser un document
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <ErrorState message="Impossible de charger les documents." />
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
      ) : documents.length === 0 ? (
        <Card className="text-center py-16">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <h3 className="font-semibold text-lg">Aucun document</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {search ? "Aucun résultat pour cette recherche." : "Téléversez votre premier document officiel."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {CATEGORY_LABELS[doc.category ?? "other"] ?? "Autre"}
                  </Badge>
                  {doc.is_public ? (
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-label="Public" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Privé" />
                  )}
                </div>
                <CardTitle className="text-base font-bold line-clamp-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{doc.title}</span>
                </CardTitle>
                {doc.description && (
                  <CardDescription className="line-clamp-2">{doc.description}</CardDescription>
                )}
              </CardHeader>

              <CardFooter className="pt-4 border-t mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(doc.created_at)}</span>
                <div className="flex items-center gap-1">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className={buttonVariants({ size: "sm", variant: "ghost", className: "h-7 w-7 p-0" })}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(doc.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <DocumentUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleUpload}
        isLoading={createDocument.isPending}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer ce document ?"
        description="Ce document sera définitivement retiré du registre."
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteDocument.isPending}
      />
    </div>
  );
}
