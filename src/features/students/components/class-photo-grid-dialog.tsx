"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassrooms } from "@/features/classrooms";
import { useStudents, useUpdateStudent } from "../hooks/use-students";
import { StudentPhotoTile } from "./student-photo-tile";

interface ClassPhotoGridDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClassPhotoGridDialog({ open, onOpenChange }: ClassPhotoGridDialogProps) {
  const [classroomId, setClassroomId] = useState("");
  const { data: classroomsData, isLoading: loadingClasses } = useClassrooms({ per_page: 100 });
  const classrooms = classroomsData?.data ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setClassroomId("");
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Photos des élèves</DialogTitle>
          <DialogDescription>
            Cliquez sur la photo d&apos;un élève pour l&apos;ajouter ou la remplacer — chaque photo est enregistrée
            immédiatement, sans passer par la fiche complète.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="photo-classroom">Classe</Label>
          <Select value={classroomId} onValueChange={(v) => setClassroomId(v ?? "")} disabled={loadingClasses}>
            <SelectTrigger id="photo-classroom" className="w-full">
              <SelectValue placeholder="Sélectionner une classe..." />
            </SelectTrigger>
            <SelectContent>
              {classrooms.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {classroomId && <ClassPhotoGrid classroomId={classroomId} />}
      </DialogContent>
    </Dialog>
  );
}

function ClassPhotoGrid({ classroomId }: { classroomId: string }) {
  const { data, isLoading } = useStudents({ classroom_id: classroomId, per_page: 100, status: "active" });
  const updateStudent = useUpdateStudent();
  const students = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 pt-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-16 rounded-full mx-auto" />
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">Aucun élève actif dans cette classe.</p>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 pt-2 pb-2">
      {students.map((student) => (
        <StudentPhotoTile
          key={student.id}
          name={student.user?.name ?? "Élève"}
          avatarUrl={student.user?.avatar_url ?? null}
          onSaved={(url) => updateStudent.mutate({ id: student.id, values: { avatar_url: url } })}
        />
      ))}
    </div>
  );
}
