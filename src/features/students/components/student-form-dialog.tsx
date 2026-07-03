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
import { useClassrooms } from "@/features/classrooms";
import { useTrackOptions } from "@/features/tracks";
import {
  createStudentSchema,
  updateStudentSchema,
  type CreateStudentInput,
  type UpdateStudentInput,
} from "../schemas";
import type { StudentWithRelations } from "../types";

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: StudentWithRelations | null;
  onSubmit: (values: CreateStudentInput | UpdateStudentInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateStudentInput;

export function StudentFormDialog({
  open,
  onOpenChange,
  student,
  onSubmit,
  isLoading = false,
}: StudentFormDialogProps) {
  const isEdit = !!student;

  const { data: classroomsData, isLoading: loadingClasses } = useClassrooms({ per_page: 100 });
  const { data: tracks = [], isLoading: loadingTracks } = useTrackOptions();

  const classrooms = classroomsData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateStudentSchema : createStudentSchema) as never,
    defaultValues: {
      name: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      gender: "male",
      date_of_birth: "",
      address: "",
      student_number: "",
      classroom_id: null,
      track_id: null,
      enrollment_date: new Date().toISOString().split("T")[0],
      scholarship_type: "none",
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      if (student) {
        reset({
          name: student.user?.name || "",
          first_name: student.user?.first_name || "",
          last_name: student.user?.last_name || "",
          email: student.user?.email || "",
          phone: student.user?.phone || "",
          gender: student.user?.gender || "male",
          date_of_birth: student.user?.date_of_birth || "",
          address: student.user?.address || "",
          student_number: student.student_number,
          classroom_id: student.classroom_id ?? null,
          track_id: student.track_id ?? null,
          enrollment_date: student.enrollment_date || "",
          scholarship_type: student.scholarship_type || "none",
          status: student.status,
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
          student_number: "",
          classroom_id: null,
          track_id: null,
          enrollment_date: new Date().toISOString().split("T")[0],
          scholarship_type: "none",
          status: "active",
        });
      }
    }
  }, [open, student, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la fiche élève" : "Inscrire un nouvel élève"}</DialogTitle>
          <DialogDescription>
            Enregistrez les informations d'identité, de contact et d'affectation de classe de l'élève.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(async (values) => {
            const payload = { ...values };
            if (payload.classroom_id === "" || payload.classroom_id === "none") {
              payload.classroom_id = null;
            }
            if (payload.track_id === "" || payload.track_id === "all") {
              payload.track_id = null;
            }
            await onSubmit(payload);
          })}
          className="space-y-4"
        >
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider border-b pb-1">Identité de l'élève</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stud-name">Nom complet *</Label>
              <Input id="stud-name" {...register("name")} placeholder="Jean Dupont" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stud-email">Email d'accès (Optionnel)</Label>
              <Input id="stud-email" type="email" {...register("email")} placeholder="jean.d@school.com" />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stud-phone">Téléphone</Label>
              <Input id="stud-phone" {...register("phone")} placeholder="+237..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stud-gender">Genre</Label>
              <select
                id="stud-gender"
                {...register("gender")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="male">Masculin</option>
                <option value="female">Féminin</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stud-birth">Date de naissance</Label>
              <Input id="stud-birth" type="date" {...register("date_of_birth")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stud-address">Adresse physique</Label>
            <Input id="stud-address" {...register("address")} placeholder="Yaoundé, Cameroun" />
          </div>

          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider border-b pb-1 pt-2">Scolarité & Inscription</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stud-number">Matricule Élève *</Label>
              <Input id="stud-number" {...register("student_number")} placeholder="MAT991" className="uppercase font-mono" />
              {errors.student_number && (
                <p className="text-xs text-destructive">{errors.student_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stud-class">Classe affectée</Label>
              <select
                id="stud-class"
                {...register("classroom_id")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={loadingClasses}
              >
                <option value="none">Non affecté (Attente)</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stud-track">Filière</Label>
              <select
                id="stud-track"
                {...register("track_id")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={loadingTracks}
              >
                <option value="all">Générale</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stud-scholar">Type de bourse</Label>
              <select
                id="stud-scholar"
                {...register("scholarship_type")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="none">Standard (Aucune)</option>
                <option value="partial">Demi-Bourse</option>
                <option value="full">Bourse Complète</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stud-enroll">Date d'inscription</Label>
              <Input id="stud-enroll" type="date" {...register("enrollment_date")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stud-status">Statut de scolarité</Label>
              <select
                id="stud-status"
                {...register("status")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="active">Actif (Inscrit)</option>
                <option value="inactive">Inactif</option>
                <option value="suspended">Exclu / Suspendu</option>
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
              {isEdit ? "Enregistrer" : "Inscrire"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
