"use client";

import { useState } from "react";
import { IdCard as IdCardIcon, Plus, Search, Printer, Trash2, Hash, Users, ImagePlus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getInitials } from "@/lib/utils";
import { useClassrooms } from "@/features/classrooms";
import { ClassPhotoGridDialog } from "@/features/students";
import { useIdCards, useCreateIdCard, useDeleteIdCard } from "../hooks/use-id-cards";
import { IdCardFormDialog } from "./id-card-form-dialog";
import { BatchIdCardDialog } from "./batch-id-card-dialog";
import { printIdCard } from "../lib/print-card";
import type { CreateIdCardInput } from "../schemas";

export function IdCardsPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: classroomsData } = useClassrooms({ per_page: 100 });
  const classrooms = classroomsData?.data ?? [];

  const { data, isLoading, error } = useIdCards({
    search: search || undefined,
    classroom_id: classFilter === "all" ? undefined : classFilter,
  });
  const createIdCard = useCreateIdCard();
  const deleteIdCard = useDeleteIdCard();

  const cards = data?.data ?? [];

  const handleCreate = async (values: CreateIdCardInput) => {
    const result = await createIdCard.mutateAsync(values);
    if (!result.error) setCreateOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteIdCard.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cartes scolaires"
        description="Registre des cartes d'identité émises pour les élèves"
        icon={IdCardIcon}
        actions={
          <>
            <Button variant="outline" onClick={() => setPhotosOpen(true)}>
              <ImagePlus className="h-4 w-4 mr-2" />
              Photos des élèves
            </Button>
            <Button variant="outline" onClick={() => setBatchOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Générer pour une classe
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Générer une carte
            </Button>
          </>
        }
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par matricule ou n° de série..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={classFilter} onValueChange={(v) => setClassFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Toutes les classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            {classrooms.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <ErrorState message="Impossible de charger les cartes scolaires." />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-16 rounded-full mb-3" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <Card className="text-center py-16">
          <IdCardIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <h3 className="font-semibold text-lg">Aucune carte générée</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {search ? "Aucun résultat pour cette recherche." : "Générez la première carte scolaire pour un élève."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card key={card.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardContent className="pt-6 pb-3 flex items-center gap-3">
                <Avatar className="h-14 w-14 border border-border flex-shrink-0">
                  <AvatarImage src={card.student?.user?.avatar_url || undefined} alt={card.student?.user?.name ?? ""} />
                  <AvatarFallback className="bg-brand-gradient text-white font-bold">
                    {getInitials(card.student?.user?.name ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{card.student?.user?.name ?? "Élève inconnu"}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {card.student?.classroom?.name || "Sans classe"}
                  </Badge>
                </div>
              </CardContent>

              <CardContent className="py-0">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {card.serial_number}
                </p>
              </CardContent>

              <CardFooter className="pt-4 border-t mt-4 flex items-center justify-between gap-1">
                <span className="text-xs text-muted-foreground">Émise le {formatDate(card.issue_date)}</span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => printIdCard(card)}>
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(card.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <IdCardFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isLoading={createIdCard.isPending}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer cette carte ?"
        description="La carte sera retirée du registre. Si l'élève a déjà reçu la carte physique, elle restera valide tant qu'elle n'est pas confisquée — cette suppression ne fait que retirer l'entrée du registre numérique."
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteIdCard.isPending}
      />

      <BatchIdCardDialog open={batchOpen} onOpenChange={setBatchOpen} />
      <ClassPhotoGridDialog open={photosOpen} onOpenChange={setPhotosOpen} />
    </div>
  );
}
