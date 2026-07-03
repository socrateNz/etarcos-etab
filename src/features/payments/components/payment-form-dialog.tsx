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
import { useFeeCategories } from "../hooks/use-payments";
import {
  createPaymentSchema,
  type CreatePaymentInput,
} from "../schemas";

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreatePaymentInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreatePaymentInput;

export function PaymentFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: PaymentFormDialogProps) {
  const { data: studentsData, isLoading: loadingStudents } = useStudents({ per_page: 200 });
  const { data: categories = [], isLoading: loadingCategories } = useFeeCategories();

  const students = studentsData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createPaymentSchema) as never,
    defaultValues: {
      student_id: "",
      fee_category_id: "",
      amount_paid: 0,
      payment_method: "cash",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        student_id: "",
        fee_category_id: "",
        amount_paid: 0,
        payment_method: "cash",
        notes: "",
      });
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer un versement</DialogTitle>
          <DialogDescription>
            Enregistrez les fonds reçus pour régler les frais de scolarité d'un élève.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(async (values) => onSubmit(values))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pay-stud">Élève *</Label>
            <select
              id="pay-stud"
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
            {errors.student_id && (
              <p className="text-xs text-destructive">{errors.student_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-fee">Type de frais *</Label>
            <select
              id="pay-fee"
              {...register("fee_category_id")}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={loadingCategories}
            >
              <option value="">Sélectionner la ligne de frais...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.amount} FCFA)
                </option>
              ))}
            </select>
            {errors.fee_category_id && (
              <p className="text-xs text-destructive">{errors.fee_category_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Montant Versé (FCFA) *</Label>
              <Input
                id="pay-amount"
                type="number"
                {...register("amount_paid", { valueAsNumber: true })}
                placeholder="ex: 50000"
              />
              {errors.amount_paid && (
                <p className="text-xs text-destructive">{errors.amount_paid.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay-method">Mode de règlement</Label>
              <select
                id="pay-method"
                {...register("payment_method")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="cash">Espèces</option>
                <option value="check">Chèque</option>
                <option value="card">Carte bancaire</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="transfer">Virement</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-notes">Notes / Références</Label>
            <Input id="pay-notes" {...register("notes")} placeholder="ex: Transaction Mobile Money ID..." />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Valider l'encaissement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
