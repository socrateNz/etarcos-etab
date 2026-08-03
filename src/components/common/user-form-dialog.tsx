"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"; // Note: using Radix/BaseUI or UI components
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
import { Loader2, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { createUserScopedAction, listOwnerEstablishmentsAction } from "@/features/users/actions";
import { SYSTEM_ROLES } from "@/types/auth";
import type { SystemRole } from "@/types/auth";

const userSchema = z.object({
  name: z.string().min(2, "Le nom complet doit comporter au moins 2 caractères."),
  email: z.string().email("Adresse email invalide."),
  role: z.string().min(1, "Veuillez sélectionner un rôle."),
  establishment_id: z.string().min(1, "Veuillez sélectionner un établissement."),
  position: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UserFormDialog({ open, onOpenChange, onSuccess }: UserFormDialogProps) {
  const [establishments, setEstablishments] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingEtabs, setLoadingEtabs] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "teacher",
      establishment_id: "",
      position: "",
    },
  });

  const selectedRole = watch("role");
  const selectedEtab = watch("establishment_id");

  useEffect(() => {
    if (open) {
      setServerError(null);
      setCreatedCredentials(null);
      reset();
      fetchEstablishments();
    }
  }, [open]);

  const fetchEstablishments = async () => {
    setLoadingEtabs(true);
    const res = await listOwnerEstablishmentsAction();
    if (res.data) {
      setEstablishments(res.data);
      if (res.data.length > 0) {
        setValue("establishment_id", res.data[0].id);
      }
    }
    setLoadingEtabs(false);
  };

  const onSubmit = async (values: UserFormValues) => {
    setServerError(null);
    const res = await createUserScopedAction({
      name: values.name,
      email: values.email,
      role: values.role as SystemRole,
      establishment_id: values.establishment_id,
      position: values.position,
    });

    if (res.error) {
      setServerError(res.error);
    } else if (res.success && res.data) {
      setCreatedCredentials({
        email: values.email,
        password: res.data.password,
      });
      if (onSuccess) onSuccess();
    }
  };

  const rolesList = [
    { value: "director", label: "Directeur d'Établissement (1 max/étab)" },
    { value: "censor", label: "Censeur / Surveillant Général" },
    { value: "accountant", label: "Comptable / Gestionnaire" },
    { value: "secretary", label: "Secrétaire" },
    { value: "teacher", label: "Enseignant" },
    { value: "librarian", label: "Bibliothécaire" },
    { value: "lab_manager", label: "Responsable Laboratoire" },
    { value: "student", label: "Élève" },
    { value: "parent", label: "Parent d'Élève" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Créer un Utilisateur</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Rattachez un nouvel intervenant à l'un de vos établissements.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {createdCredentials ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              Compte créé avec succès !
            </div>
            <div className="text-xs space-y-1 bg-background/80 p-3 rounded-lg border border-border">
              <p><span className="font-semibold text-muted-foreground">Identifiant (Email) :</span> <span className="font-mono text-foreground">{createdCredentials.email}</span></p>
              <p><span className="font-semibold text-muted-foreground">Mot de passe temporaire :</span> <span className="font-mono font-bold text-primary">{createdCredentials.password}</span></p>
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              Transmettez ces accès à l'utilisateur. Il sera invité à changer son mot de passe lors de sa première connexion.
            </p>
            <Button
              className="w-full mt-2"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {serverError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Nom complet */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-semibold">Nom & Prénom *</Label>
              <Input
                id="name"
                placeholder="Ex: Jean Dupont"
                {...register("name")}
                className="bg-card text-sm"
              />
              {errors.name && <p className="text-[11px] text-destructive">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold">Adresse E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ex: j.dupont@etablissement.com"
                {...register("email")}
                className="bg-card text-sm"
              />
              {errors.email && <p className="text-[11px] text-destructive">{errors.email.message}</p>}
            </div>

            {/* Rôle */}
            <div className="space-y-1">
              <Label htmlFor="role" className="text-xs font-semibold">Rôle de l'Utilisateur *</Label>
              <Select
                value={selectedRole}
                onValueChange={(val) => val && setValue("role", val)}
              >
                <SelectTrigger className="bg-card text-sm">
                  <SelectValue placeholder="Sélectionner un rôle..." />
                </SelectTrigger>
                <SelectContent>
                  {rolesList.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRole === "director" && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Un seul directeur est autorisé par établissement.
                </p>
              )}
            </div>

            {/* Établissement */}
            <div className="space-y-1">
              <Label htmlFor="establishment" className="text-xs font-semibold">Établissement de Rattachement *</Label>
              {loadingEtabs ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Chargement de vos établissements...
                </div>
              ) : (
                <Select
                  value={selectedEtab}
                  onValueChange={(val) => val && setValue("establishment_id", val)}
                >
                  <SelectTrigger className="bg-card text-sm">
                    <SelectValue placeholder="Sélectionner l'établissement..." />
                  </SelectTrigger>
                  <SelectContent>
                    {establishments.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.establishment_id && <p className="text-[11px] text-destructive">{errors.establishment_id.message}</p>}
            </div>

            <DialogFooter className="pt-4 border-t border-border flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Création...
                  </>
                ) : (
                  "Créer le compte"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
