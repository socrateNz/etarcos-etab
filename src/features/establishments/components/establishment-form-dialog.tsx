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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createEstablishmentSchema,
  updateEstablishmentFormSchema,
  type CreateEstablishmentInput,
  type UpdateEstablishmentFormInput,
} from "../schemas";
import { ESTABLISHMENT_PLAN_LABELS } from "../types";
import type { Establishment } from "@/types/database";
import { slugify } from "@/lib/utils";

interface EstablishmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishment?: Establishment | null;
  onSubmit: (values: CreateEstablishmentInput | UpdateEstablishmentFormInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateEstablishmentInput & { status?: Establishment["status"] };

export function EstablishmentFormDialog({
  open,
  onOpenChange,
  establishment,
  onSubmit,
  isLoading = false,
}: EstablishmentFormDialogProps) {
  const isEdit = !!establishment;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(
      isEdit ? updateEstablishmentFormSchema : createEstablishmentSchema
    ) as never,
    defaultValues: {
      name: "",
      slug: "",
      address: "",
      city: "",
      country: "Cameroun",
      phone: "",
      email: "",
      website: "",
      plan: "free",
      status: "active",
    },
  });

  const name = watch("name");
  const plan = watch("plan");
  const status = watch("status");

  useEffect(() => {
    if (open && establishment) {
      reset({
        name: establishment.name,
        slug: establishment.slug,
        address: establishment.address ?? "",
        city: establishment.city ?? "",
        country: establishment.country,
        phone: establishment.phone ?? "",
        email: establishment.email ?? "",
        website: establishment.website ?? "",
        plan: establishment.plan,
        status: establishment.status,
      });
    } else if (open && !establishment) {
      reset({
        name: "",
        slug: "",
        address: "",
        city: "",
        country: "Cameroun",
        phone: "",
        email: "",
        website: "",
        plan: "free",
        status: "active",
      });
    }
  }, [open, establishment, reset]);

  useEffect(() => {
    if (!isEdit && name && open) {
      setValue("slug", slugify(name), { shouldValidate: true });
    }
  }, [name, isEdit, open, setValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'établissement" : "Nouvel établissement"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mettez à jour les informations de l'établissement."
              : "Créez un nouvel établissement sur la plateforme."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values);
          })}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" {...register("name")} placeholder="Collège Saint-Joseph" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="slug">Slug URL</Label>
              <Input id="slug" {...register("slug")} placeholder="college-saint-joseph" />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" {...register("city")} placeholder="Douala" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input id="country" {...register("country")} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" {...register("address")} placeholder="Quartier, rue…" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" {...register("phone")} placeholder="+237 6XX XXX XXX" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="website">Site web</Label>
              <Input id="website" {...register("website")} placeholder="https://" />
            </div>

            <div className="space-y-2">
              <Label>Formule</Label>
              <Select
                value={plan}
                onValueChange={(v) => setValue("plan", v as FormValues["plan"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Formule" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTABLISHMENT_PLAN_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isEdit && (
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={status}
                  onValueChange={(v) =>
                    setValue("status", v as FormValues["status"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="suspended">Suspendu</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
