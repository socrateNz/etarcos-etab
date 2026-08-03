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
import { createDiplomaSchema, type CreateDiplomaInput } from "../schemas";

interface DiplomaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateDiplomaInput) => Promise<void>;
  isLoading?: boolean;
}

export function DiplomaFormDialog({ open, onOpenChange, onSubmit, isLoading = false }: DiplomaFormDialogProps) {
  const { data: studentsData, isLoading: loadingStudents } = useStudents({ per_page: 200, status: "active" });
  const students = studentsData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateDiplomaInput>({
    resolver: zodResolver(createDiplomaSchema),
    defaultValues: {
      student_id: "",
      name: "",
      issue_date: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (open) {
      reset({ student_id: "", name: "", issue_date: new Date().toISOString().split("T")[0] });
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Émettre un diplôme</DialogTitle>
          <DialogDescription>
            Le numéro de série est généré automatiquement et ne peut pas être modifié.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(async (values) => onSubmit(values))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="diploma-student">Élève *</Label>
            <select
              id="diploma-student"
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

          <div className="space-y-2">
            <Label htmlFor="diploma-name">Nom du diplôme *</Label>
            <Input
              id="diploma-name"
              {...register("name")}
              placeholder="Ex: Baccalauréat Général (Série C), BEPC..."
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="diploma-date">Date d&apos;émission</Label>
            <Input id="diploma-date" type="date" {...register("issue_date")} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Émettre le diplôme
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
