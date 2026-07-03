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
import {
  createExpenseSchema,
  updateExpenseSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
} from "../schemas";
import type { Expense } from "../types";

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  onSubmit: (values: CreateExpenseInput | UpdateExpenseInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateExpenseInput;

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  onSubmit,
  isLoading = false,
}: ExpenseFormDialogProps) {
  const isEdit = !!expense;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateExpenseSchema : createExpenseSchema) as never,
    defaultValues: {
      category: "Fournitures",
      description: "",
      amount: 10000,
      expense_date: new Date().toISOString().split("T")[0],
      receipt_url: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (expense) {
        reset({
          category: expense.category,
          description: expense.description,
          amount: Number(expense.amount),
          expense_date: expense.expense_date || "",
          receipt_url: expense.receipt_url ?? "",
        });
      } else {
        reset({
          category: "Fournitures",
          description: "",
          amount: 10000,
          expense_date: new Date().toISOString().split("T")[0],
          receipt_url: "",
        });
      }
    }
  }, [open, expense, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la dépense" : "Enregistrer une dépense"}</DialogTitle>
          <DialogDescription>
            Saisissez les informations de sortie de caisse pour la comptabilité de l'établissement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(async (values) => onSubmit(values))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exp-cat">Catégorie</Label>
              <select
                id="exp-cat"
                {...register("category")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Fournitures">Fournitures scolaires</option>
                <option value="Salaires">Salaires & RH</option>
                <option value="Maintenance">Maintenance & Travaux</option>
                <option value="Factures">Factures (Eau/Élec/Net)</option>
                <option value="Loyers">Loyer & Location</option>
                <option value="Autres">Autres charges</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-date">Date de dépense *</Label>
              <Input id="exp-date" type="date" {...register("expense_date")} />
              {errors.expense_date && (
                <p className="text-xs text-destructive">{errors.expense_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-desc">Libellé / Description *</Label>
            <Input id="exp-desc" {...register("description")} placeholder="ex: Achat de craies et rames de papier A4" />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-amount">Montant déboursé (FCFA) *</Label>
            <Input
              id="exp-amount"
              type="number"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Enregistrer la dépense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
