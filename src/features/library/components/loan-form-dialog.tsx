"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStudents } from "@/features/students";
import { createLoanSchema, type CreateLoanInput } from "../schemas";
import type { BookWithLoans } from "../types";

interface LoanFormDialogProps {
  open: boolean;
  book?: BookWithLoans;
  onClose: () => void;
  onSubmit: (values: CreateLoanInput) => Promise<void>;
  isLoading?: boolean;
}

export function LoanFormDialog({ open, book, onClose, onSubmit, isLoading = false }: LoanFormDialogProps) {
  // Default due date: today + 14 days
  const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: studentsData } = useStudents({ per_page: 300 });
  const students = studentsData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateLoanInput>({
    resolver: zodResolver(createLoanSchema),
    defaultValues: {
      book_id: book?.id ?? "",
      borrower_id: "",
      due_date: defaultDueDate,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        book_id: book?.id ?? "",
        borrower_id: "",
        due_date: defaultDueDate,
        notes: "",
      });
    }
  }, [open, book, reset]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Enregistrer un prêt</DialogTitle>
          <DialogDescription>
            {book ? `Prêt pour : « ${book.title} »` : "Sélectionnez un livre et un emprunteur."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <input type="hidden" {...register("book_id")} value={book?.id ?? ""} />

          <div className="space-y-1.5">
            <Label>Emprunteur (élève) <span className="text-destructive">*</span></Label>
            <select
              {...register("borrower_id")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sélectionner un élève...</option>
              {students.map((s: any) => (
                <option key={s.id} value={s.user_id ?? s.id}>
                  {s.user?.name ?? s.id} — {s.student_number}
                </option>
              ))}
            </select>
            {errors.borrower_id && <p className="text-xs text-destructive">{errors.borrower_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Date de retour prévue <span className="text-destructive">*</span></Label>
            <Input type="date" {...register("due_date")} />
            {errors.due_date && <p className="text-xs text-destructive">{errors.due_date.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...register("notes")} placeholder="Remarques éventuelles..." rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer le prêt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
