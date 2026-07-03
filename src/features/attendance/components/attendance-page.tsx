"use client";

import { useEffect, useState } from "react";
import { UserCheck, BookOpen, Save, Loader2, Check, X, Clock, HelpCircle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useClassrooms } from "@/features/classrooms";
import { useSubjects } from "@/features/subjects";
import { useClassroomAttendance, useSaveAttendance } from "../hooks/use-attendance";
import type { AttendanceItemInput } from "../schemas";

export function AttendancePage() {
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("none");

  // Load selection lists
  const { data: classroomsData } = useClassrooms({ per_page: 100 });
  const { data: subjectsData } = useSubjects({ per_page: 100 });

  const classrooms = classroomsData?.data ?? [];
  const subjects = subjectsData?.data ?? [];

  const isEnabled = selectedClassId !== "all" && !!selectedDate;

  // Fetch sheet
  const {
    data: attendanceData = [],
    isLoading: loadingSheet,
    isError,
    error,
  } = useClassroomAttendance(
    selectedClassId,
    selectedDate,
    selectedSubjectId === "none" ? null : selectedSubjectId,
    isEnabled
  );

  const saveAttendance = useSaveAttendance();

  // Local state to keep sheet inputs
  const [localSheet, setLocalSheet] = useState<AttendanceItemInput[]>([]);

  // Sync when data loads
  useEffect(() => {
    if (attendanceData.length > 0) {
      setLocalSheet(
        attendanceData.map((a) => ({
          student_id: a.student_id,
          status: a.status,
          justification: a.justification || "",
        }))
      );
    } else {
      setLocalSheet([]);
    }
  }, [attendanceData]);

  const handleStatusChange = (studentId: string, status: "present" | "absent" | "late" | "excused") => {
    setLocalSheet((prev) =>
      prev.map((item) => (item.student_id === studentId ? { ...item, status } : item))
    );
  };

  const handleJustificationChange = (studentId: string, justification: string) => {
    setLocalSheet((prev) =>
      prev.map((item) => (item.student_id === studentId ? { ...item, justification } : item))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClassId === "all") return;

    await saveAttendance.mutateAsync({
      classroom_id: selectedClassId,
      date: selectedDate,
      subject_id: selectedSubjectId === "none" ? null : selectedSubjectId,
      attendances: localSheet,
    });
  };

  // Quick action to mark everyone present
  const handleMarkAllPresent = () => {
    setLocalSheet((prev) => prev.map((item) => ({ ...item, status: "present" })));
  };

  // Math Statistics
  const totalStudents = localSheet.length;
  const presentCount = localSheet.filter((s) => s.status === "present").length;
  const absentCount = localSheet.filter((s) => s.status === "absent").length;
  const lateCount = localSheet.filter((s) => s.status === "late").length;
  const excusedCount = localSheet.filter((s) => s.status === "excused").length;

  const presenceRate = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feuille d'Appel & Présences"
        description="Enregistrez la présence journalière des élèves ou par heure de cours."
        icon={UserCheck}
      />

      {/* Selectors grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 rounded-xl border">
        <div className="space-y-2">
          <Label htmlFor="att-class">Classe</Label>
          <select
            id="att-class"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">Sélectionner une classe...</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="att-date">Date de l'appel</Label>
          <Input
            id="att-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="att-subj">Matière / Cours (Optionnel)</Label>
          <select
            id="att-subj"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="none">Présence Journalière (Générale)</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isEnabled && !isError && attendanceData.length > 0 && (
        <>
          {/* Quick Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Taux de présence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">{presenceRate}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Présents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  {presentCount} / {totalStudents}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Absents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-500">
                  {absentCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">En retard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">
                  {lateCount}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Roll Call Sheet */}
          <div className="bg-card rounded-xl border overflow-hidden">
            <form onSubmit={handleSave}>
              <div className="p-4 border-b bg-muted/30 flex flex-wrap gap-4 items-center justify-between">
                <Button type="button" variant="outline" size="sm" onClick={handleMarkAllPresent} className="text-xs font-sans">
                  Tout marquer comme présent
                </Button>

                <Button type="submit" disabled={saveAttendance.isPending} className="bg-brand-500 hover:bg-brand-600 text-white gap-1.5 h-8 text-xs font-sans">
                  {saveAttendance.isPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Save className="size-3" />
                  )}
                  Enregistrer l'appel
                </Button>
              </div>

              {loadingSheet ? (
                <div className="p-12 flex items-center justify-center">
                  <Loader2 className="size-6 text-brand-500 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Chargement des élèves…</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="p-4">Matricule</th>
                        <th className="p-4">Nom de l'élève</th>
                        <th className="p-4 w-[380px]">Statut d'appel</th>
                        <th className="p-4">Justification de l'absence / retard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {attendanceData.map((a) => {
                        const localItem = localSheet.find((l) => l.student_id === a.student_id);
                        const currentStatus = localItem ? localItem.status : "present";
                        const justification = localItem ? localItem.justification : "";

                        return (
                          <tr key={a.student_id} className="hover:bg-muted/5 transition-colors">
                            <td className="p-4 font-mono text-xs text-muted-foreground">
                              {a.student?.student_number}
                            </td>
                            <td className="p-4 font-semibold text-foreground">
                              {a.student?.user?.name}
                            </td>
                            <td className="p-4">
                              <div className="flex rounded-md border p-0.5 bg-muted/30 w-fit">
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(a.student_id, "present")}
                                  className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${
                                    currentStatus === "present"
                                      ? "bg-emerald-500 text-white shadow-sm"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <Check className="size-3" /> Présent
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(a.student_id, "absent")}
                                  className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${
                                    currentStatus === "absent"
                                      ? "bg-rose-500 text-white shadow-sm"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <X className="size-3" /> Absent
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(a.student_id, "late")}
                                  className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${
                                    currentStatus === "late"
                                      ? "bg-amber-500 text-white shadow-sm"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <Clock className="size-3" /> Retard
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(a.student_id, "excused")}
                                  className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${
                                    currentStatus === "excused"
                                      ? "bg-blue-500 text-white shadow-sm"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <HelpCircle className="size-3" /> Justifié
                                </button>
                              </div>
                            </td>
                            <td className="p-4">
                              <Input
                                value={justification || ""}
                                onChange={(e) => handleJustificationChange(a.student_id, e.target.value)}
                                placeholder="ex: Certificat médical, Retard bus..."
                                className="w-full h-8 text-xs bg-muted/30"
                                disabled={currentStatus === "present"}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </form>
          </div>
        </>
      )}

      {(!isEnabled || attendanceData.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 border rounded-xl bg-card border-dashed">
          <BookOpen className="size-10 text-muted-foreground stroke-1 mb-3 animate-pulse" />
          <p className="font-semibold text-sm text-foreground">Feuille d'appel non chargée</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">
            Sélectionnez une **classe** et une **date** ci-dessus pour charger la liste d'appel des élèves.
          </p>
        </div>
      )}
    </div>
  );
}
