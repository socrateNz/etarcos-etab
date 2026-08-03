import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { listOwnerEstablishmentsAction } from "@/features/users/actions";
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
  createStaffSchema,
  updateStaffSchema,
  type CreateStaffInput,
  type UpdateStaffInput,
} from "../schemas";
import type { StaffMemberWithUser } from "../types";

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: StaffMemberWithUser | null;
  onSubmit: (values: CreateStaffInput | UpdateStaffInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateStaffInput;

export function StaffFormDialog({
  open,
  onOpenChange,
  staff,
  onSubmit,
  isLoading = false,
}: StaffFormDialogProps) {
  const isEdit = !!staff;
  const { user } = useAuth();
  const isOwnerOrSuperAdmin = user?.role === "owner" || user?.role === "super_admin";
  const [establishments, setEstablishments] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingEtabs, setLoadingEtabs] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateStaffSchema : createStaffSchema) as never,
    defaultValues: {
      name: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      gender: "male",
      date_of_birth: "",
      address: "",
      employee_number: "",
      department: "",
      position: "",
      establishment_id: "",
      hire_date: new Date().toISOString().split("T")[0],
      salary: null,
      contract_type: "permanent",
      status: "active",
    },
  });

  const selectedPos = watch("position");

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setLoadingEtabs(true);

    listOwnerEstablishmentsAction().then((res) => {
      if (!isMounted) return;
      if (res.data) {
        setEstablishments(res.data);
        const dirEtabId = user?.establishment_id;
        if (dirEtabId) {
          setValue("establishment_id", dirEtabId);
        } else if (res.data.length > 0 && !staff?.establishment_id) {
          setValue("establishment_id", res.data[0].id);
        }
      }
      setLoadingEtabs(false);
    });

    if (staff) {
      reset({
        name: staff.user?.name || "",
        first_name: staff.user?.first_name || "",
        last_name: staff.user?.last_name || "",
        email: staff.user?.email || "",
        phone: staff.user?.phone || "",
        gender: staff.user?.gender || "male",
        date_of_birth: staff.user?.date_of_birth || "",
        address: staff.user?.address || "",
        employee_number: staff.employee_number,
        department: staff.department || "",
        position: staff.position,
        establishment_id: user?.establishment_id || staff.establishment_id || "",
        hire_date: staff.hire_date || "",
        salary: staff.salary,
        contract_type: staff.contract_type,
        status: staff.status,
      });
    } else {
      reset({
        name: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        gender: "male",
        date_of_birth: "",
        address: "",
        employee_number: "",
        department: "",
        position: "Enseignant",
        establishment_id: user?.establishment_id || "",
        hire_date: new Date().toISOString().split("T")[0],
        salary: null,
        contract_type: "permanent",
        status: "active",
      });
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-deps
  }, [open, staff]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la fiche personnel" : "Recruter un personnel"}</DialogTitle>
          <DialogDescription>
            Saisissez les informations d'identité et les conditions de contrat de l'employé. Un compte d'accès sera créé.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(async (values) => onSubmit(values))} className="space-y-4">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider border-b pb-1">Identité de l'employé</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Nom complet *</Label>
              <Input id="staff-name" {...register("name")} placeholder="Socrate Nguema" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-email">Email d'accès *</Label>
              <Input
                id="staff-email"
                type="email"
                {...register("email")}
                placeholder="socrate.n@school.com"
                disabled={isEdit}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="staff-password">Mot de passe d'accès (Optionnel)</Label>
              <Input
                id="staff-password"
                type="text"
                {...register("password")}
                placeholder="Généré automatiquement si vous laissez vide (ex: aB3#xY8z)"
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                Laissez ce champ vide si vous souhaitez générer un mot de passe sécurisé aléatoire.
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="staff-phone">Téléphone</Label>
              <Input id="staff-phone" {...register("phone")} placeholder="+237 6..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-gender">Genre</Label>
              <select
                id="staff-gender"
                {...register("gender")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="male">Masculin</option>
                <option value="female">Féminin</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-birth">Date de naissance</Label>
              <Input id="staff-birth" type="date" {...register("date_of_birth")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-address">Adresse physique</Label>
            <Input id="staff-address" {...register("address")} placeholder="Quartier Bastos, Yaoundé" />
          </div>

          {/* Select Établissement for Owner & Multi-etab users */}
          {(isOwnerOrSuperAdmin || establishments.length > 0) && (
            <div className="space-y-2">
              <Label htmlFor="staff-etab">Établissement de Recrutement *</Label>
              {loadingEtabs ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Chargement de vos établissements...
                </div>
              ) : establishments.length === 0 ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                  ⚠️ Aucun établissement rattaché à votre compte. Veuillez d'abord créer un établissement dans l'onglet Établissements.
                </div>
              ) : (
                <>
                  <select
                    id="staff-etab"
                    {...register("establishment_id")}
                    disabled={!isOwnerOrSuperAdmin}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium disabled:opacity-80 disabled:bg-muted disabled:cursor-not-allowed"
                  >
                    {establishments.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                  {!isOwnerOrSuperAdmin && (
                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      🔒 En tant que Directeur, le recrutement est automatiquement sélectionné et verrouillé sur votre établissement.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider border-b pb-1 pt-2">Contrat & Poste</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="staff-empnum">Matricule Employé *</Label>
              <Input id="staff-empnum" {...register("employee_number")} placeholder="EMP001" className="uppercase font-mono" />
              {errors.employee_number && (
                <p className="text-xs text-destructive">{errors.employee_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-pos">Poste / Rôle de l'Employé *</Label>
              <select
                id="staff-pos"
                {...register("position")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium"
              >
                {isOwnerOrSuperAdmin && (
                  <option value="Directeur d'Établissement">Directeur d'Établissement (1 max par établissement)</option>
                )}
                <option value="Censeur / Surveillant Général">Censeur / Surveillant Général</option>
                <option value="Comptable / Gestionnaire">Comptable / Gestionnaire</option>
                <option value="Secrétaire">Secrétaire</option>
                <option value="Enseignant">Enseignant / Professeur</option>
                <option value="Bibliothécaire">Bibliothécaire</option>
                <option value="Responsable Laboratoire">Responsable Laboratoire</option>
              </select>
              {selectedPos?.toLowerCase().includes("direct") && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Note: Un seul Directeur est autorisé par établissement. S'il existe déjà un Directeur actif, la création sera refusée.
                </p>
              )}
              {errors.position && (
                <p className="text-xs text-destructive">{errors.position.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="staff-dept">Département</Label>
              <Input id="staff-dept" {...register("department")} placeholder="Lettres / Sciences" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-contract">Type de contrat</Label>
              <select
                id="staff-contract"
                {...register("contract_type")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="permanent">CDI (Permanent)</option>
                <option value="temporary">CDD (Temporaire)</option>
                <option value="part_time">Temps partiel</option>
                <option value="intern">Stagiaire</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-hire">Date de recrutement</Label>
              <Input id="staff-hire" type="date" {...register("hire_date")} />
              {errors.hire_date && (
                <p className="text-xs text-destructive">{errors.hire_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="staff-salary">Salaire mensuel (FCFA)</Label>
              <Input
                id="staff-salary"
                type="number"
                {...register("salary", { valueAsNumber: true })}
                placeholder="250000"
              />
              {errors.salary && (
                <p className="text-xs text-destructive">{errors.salary.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-status">Statut de l'employé</Label>
              <select
                id="staff-status"
                {...register("status")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="suspended">Suspendu</option>
                <option value="pending">En attente</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Recruter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
