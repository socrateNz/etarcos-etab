"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudents } from "@/features/students";
import { createIdCardSchema, type CreateIdCardInput } from "../schemas";

interface IdCardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateIdCardInput) => Promise<void>;
  isLoading?: boolean;
}

export function IdCardFormDialog({ open, onOpenChange, onSubmit, isLoading = false }: IdCardFormDialogProps) {
  const { data: studentsData, isLoading: loadingStudents } = useStudents({ per_page: 100, status: "active" });
  const students = studentsData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateIdCardInput>({
    resolver: zodResolver(createIdCardSchema),
    defaultValues: {
      student_id: "",
      issue_date: new Date().toISOString().split("T")[0],
      expiry_date: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({ student_id: "", issue_date: new Date().toISOString().split("T")[0], expiry_date: "" });
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Générer une carte scolaire</DialogTitle>
          <DialogDescription>
            Le numéro de série est généré automatiquement. Sans photo sur la fiche élève, la carte affichera les
            initiales.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(async (values) => onSubmit(values))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idcard-student">Élève *</Label>
            <select
              id="idcard-student"
              {...register("student_id")}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={loadingStudents}
            >
              <option value="">Sélectionner un élève...</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.user?.name} ({st.student_number}) — {st.classroom?.name || "Pas de classe"}
                </option>
              ))}
            </select>
            {errors.student_id && <p className="text-xs text-destructive">{errors.student_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="idcard-issue">Date d&apos;émission</Label>
              <Input id="idcard-issue" type="date" {...register("issue_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idcard-expiry">Date d&apos;expiration</Label>
              <Input id="idcard-expiry" type="date" {...register("expiry_date")} />
              <p className="text-[11px] text-muted-foreground">Par défaut : 31 août de l&apos;année suivante.</p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Générer la carte
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
