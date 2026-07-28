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
import { createBookSchema, updateBookSchema, type CreateBookInput, type UpdateBookInput } from "../schemas";
import type { BookWithLoans } from "../types";

interface BookFormDialogProps {
  open: boolean;
  book?: BookWithLoans;
  onClose: () => void;
  onSubmit: (values: CreateBookInput | UpdateBookInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateBookInput;

export function BookFormDialog({ open, book, onClose, onSubmit, isLoading = false }: BookFormDialogProps) {
  const isEdit = !!book;
  const schema = isEdit ? updateBookSchema.omit({ id: true }) : createBookSchema;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      category: "",
      publisher: "",
      quantity: 1,
      location: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset(book
        ? { title: book.title, author: book.author, isbn: book.isbn ?? "", category: book.category ?? "", publisher: book.publisher ?? "", quantity: book.quantity, location: book.location ?? "" }
        : { title: "", author: "", isbn: "", category: "", publisher: "", quantity: 1, location: "" }
      );
    }
  }, [open, book, reset]);

  const handleFormSubmit = async (values: FormValues) => {
    if (isEdit && book) {
      await onSubmit({ ...values, id: book.id });
    } else {
      await onSubmit(values);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le livre" : "Ajouter un livre"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifiez les informations du livre." : "Remplissez les informations pour ajouter un livre au catalogue."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label>Titre <span className="text-destructive">*</span></Label>
              <Input {...register("title")} placeholder="Titre du livre" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Auteur <span className="text-destructive">*</span></Label>
              <Input {...register("author")} placeholder="Nom de l'auteur" />
              {errors.author && <p className="text-xs text-destructive">{errors.author.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>ISBN</Label>
                <Input {...register("isbn")} placeholder="978-xxx-xxx" />
              </div>
              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <Input {...register("category")} placeholder="Littérature, Sciences..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Éditeur</Label>
                <Input {...register("publisher")} placeholder="Nom de l'éditeur" />
              </div>
              <div className="space-y-1.5">
                <Label>Quantité <span className="text-destructive">*</span></Label>
                <Input type="number" min={1} {...register("quantity")} />
                {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Localisation (étagère, salle...)</Label>
              <Input {...register("location")} placeholder="Ex: Étagère A, Rayon 3" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
