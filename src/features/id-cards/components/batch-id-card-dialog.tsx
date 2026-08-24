"use client";

import { useState } from "react";
import { Loader2, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClassrooms } from "@/features/classrooms";
import { useOwnerStore } from "@/store/owner-store";
import { useCreateIdCardsForClassroom } from "../hooks/use-id-cards";
import { listIdCardsAction } from "../actions";
import { printIdCardsBatch } from "../lib/print-card";

interface BatchIdCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchIdCardDialog({ open, onOpenChange }: BatchIdCardDialogProps) {
  const [classroomId, setClassroomId] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

  const { data: classroomsData, isLoading: loadingClasses } = useClassrooms({ per_page: 100 });
  const classrooms = classroomsData?.data ?? [];
  const { selectedEstablishmentId } = useOwnerStore();

  const createBatch = useCreateIdCardsForClassroom();

  const isBusy = createBatch.isPending || isPrinting;

  const handleGenerateAndPrint = async () => {
    if (!classroomId) return;

    const result = await createBatch.mutateAsync({ classroom_id: classroomId });
    if (result.error) return;

    setIsPrinting(true);
    try {
      const listResult = await listIdCardsAction(
        { classroom_id: classroomId, page_size: 100 },
        selectedEstablishmentId || undefined
      );
      const cards = listResult.data?.data ?? [];
      if (cards.length > 0) {
        const classroomName = classrooms.find((c) => c.id === classroomId)?.name;
        printIdCardsBatch(cards, classroomName);
      }
      onOpenChange(false);
      setClassroomId("");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Générer les cartes d&apos;une classe</DialogTitle>
          <DialogDescription>
            Génère une carte pour chaque élève actif de la classe qui n&apos;en a pas encore, puis ouvre
            l&apos;impression de toutes les cartes de la classe (existantes et nouvelles) en un seul document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="batch-classroom">Classe *</Label>
          <Select value={classroomId} onValueChange={(v) => setClassroomId(v ?? "")} disabled={loadingClasses}>
            <SelectTrigger id="batch-classroom" className="w-full">
              <SelectValue placeholder="Sélectionner une classe..." />
            </SelectTrigger>
            <SelectContent>
              {classrooms.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
            Annuler
          </Button>
          <Button type="button" onClick={handleGenerateAndPrint} disabled={!classroomId || isBusy}>
            {isBusy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Printer className="mr-2 size-4" />}
            Générer &amp; imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
