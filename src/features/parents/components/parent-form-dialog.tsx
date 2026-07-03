"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useStudents } from "@/features/students";
import {
  createParentSchema,
  updateParentSchema,
  type CreateParentInput,
  type UpdateParentInput,
} from "../schemas";
import type { ParentWithRelations } from "../types";

interface ParentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parent?: ParentWithRelations | null;
  onSubmit: (values: CreateParentInput | UpdateParentInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateParentInput;

export function ParentFormDialog({
  open,
  onOpenChange,
  parent,
  onSubmit,
  isLoading = false,
}: ParentFormDialogProps) {
  const isEdit = !!parent;
  const { data: studentsData, isLoading: loadingStudents } = useStudents({ per_page: 200 });
  const allStudents = studentsData?.data ?? [];

  const [linkedStudents, setLinkedStudents] = useState<{ id: string; name: string }[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateParentSchema : createParentSchema) as never,
    defaultValues: {
      name: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      gender: "male",
      date_of_birth: "",
      address: "",
      relationship: "guardian",
      profession: "",
      is_emergency_contact: false,
      student_ids: [],
    },
  });

  useEffect(() => {
    if (open) {
      if (parent) {
        reset({
          name: parent.user?.name || "",
          first_name: parent.user?.first_name || "",
          last_name: parent.user?.last_name || "",
          email: parent.user?.email || "",
          phone: parent.user?.phone || "",
          gender: parent.user?.gender || "male",
          date_of_birth: parent.user?.date_of_birth || "",
          address: parent.user?.address || "",
          relationship: parent.relationship,
          profession: parent.profession || "",
          is_emergency_contact: parent.is_emergency_contact,
          student_ids: (parent.students ?? []).map((s) => s.id),
        });
        setLinkedStudents(
          (parent.students ?? []).map((s) => ({
            id: s.id,
            name: `${s.user?.name || "Élève"} (${s.student_number})`,
          }))
        );
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
          relationship: "guardian",
          profession: "",
          is_emergency_contact: false,
          student_ids: [],
        });
        setLinkedStudents([]);
      }
    }
  }, [open, parent, reset]);

  // Sync state to react-hook-form
  useEffect(() => {
    setValue("student_ids", linkedStudents.map((s) => s.id));
  }, [linkedStudents, setValue]);

  const handleAddStudent = (studentId: string) => {
    if (!studentId || studentId === "select") return;
    if (linkedStudents.some((s) => s.id === studentId)) return;

    const studentObj = allStudents.find((s) => s.id === studentId);
    if (studentObj) {
      setLinkedStudents([
        ...linkedStudents,
        {
          id: studentId,
          name: `${studentObj.user?.name} (${studentObj.student_number})`,
        },
      ]);
    }
  };

  const handleRemoveStudent = (studentId: string) => {
    setLinkedStudents(linkedStudents.filter((s) => s.id !== studentId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le parent" : "Créer une fiche parent"}</DialogTitle>
          <DialogDescription>
            Enregistrez les coordonnées du parent et associez-le aux élèves correspondants.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(async (values) => onSubmit(values))} className="space-y-4">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider border-b pb-1">Identité & Coordonnées</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parent-name">Nom complet *</Label>
              <Input id="parent-name" {...register("name")} placeholder="Jean de Dieu Kamga" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-email">Email *</Label>
              <Input
                id="parent-email"
                type="email"
                {...register("email")}
                placeholder="parent.kamga@gmail.com"
                disabled={isEdit}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parent-phone">Téléphone *</Label>
              <Input id="parent-phone" {...register("phone")} placeholder="+237 6..." />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-gender">Genre</Label>
              <select
                id="parent-gender"
                {...register("gender")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="male">Masculin</option>
                <option value="female">Féminin</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-relationship">Lien de parenté</Label>
              <select
                id="parent-relationship"
                {...register("relationship")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="father">Père</option>
                <option value="mother">Mère</option>
                <option value="guardian">Tuteur / Tutrice</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parent-profession">Profession</Label>
              <Input id="parent-profession" {...register("profession")} placeholder="ex: Médecin, Enseignant" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-address">Adresse de résidence</Label>
              <Input id="parent-address" {...register("address")} placeholder="Yaoundé" />
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="parent-emergency"
              {...register("is_emergency_contact")}
              className="rounded border-input text-brand-500 focus:ring-brand-500 size-4"
            />
            <Label htmlFor="parent-emergency" className="cursor-pointer font-medium text-sm">
              Définir comme contact d'urgence principal pour l'élève
            </Label>
          </div>

          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider border-b pb-1 pt-2">Élèves rattachés (Enfants)</p>

          <div className="space-y-2">
            <Label htmlFor="student-select">Rechercher et ajouter un élève</Label>
            <select
              id="student-select"
              onChange={(e) => handleAddStudent(e.target.value)}
              value="select"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={loadingStudents}
            >
              <option value="select">Choisir un élève dans la liste...</option>
              {allStudents
                .filter((st) => !linkedStudents.some((link) => link.id === st.id))
                .map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.user?.name} ({st.student_number}) — {st.classroom?.name || "Pas de classe"}
                  </option>
                ))}
            </select>
          </div>

          {linkedStudents.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted/50 border rounded-lg">
              {linkedStudents.map((st) => (
                <Badge key={st.id} variant="secondary" className="gap-1.5 py-1 px-2.5 font-sans">
                  {st.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveStudent(st.id)}
                    className="text-muted-foreground hover:text-foreground hover:bg-black/10 rounded-full size-4 flex items-center justify-center transition-all"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer le parent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
