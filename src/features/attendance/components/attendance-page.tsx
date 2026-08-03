"use client";

import { useEffect, useState } from "react";
import {
  UserCheck, BookOpen, Save, Loader2, Check, X, Clock, HelpCircle,
  Trash2, AlertTriangle, PlayCircle, History, Search, Calendar, Filter
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useClassrooms } from "@/features/classrooms";
import { useSubjects } from "@/features/subjects";
import {
  useClassroomAttendance,
  useSaveAttendance,
  useDeleteAttendanceSession,
  useDeleteAttendanceRecord,
  useAttendanceLogs,
  useTeacherAssignedOptions,
} from "../hooks/use-attendance";
import type { AttendanceItemInput } from "../schemas";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  present: { label: "Présent", color: "bg-emerald-500/15 text-emerald-600 border-emerald-400" },
  absent: { label: "Absent", color: "bg-rose-500/15 text-rose-600 border-rose-400" },
  late: { label: "Retard", color: "bg-amber-500/15 text-amber-600 border-amber-400" },
  excused: { label: "Justifié", color: "bg-blue-500/15 text-blue-600 border-blue-400" },
};

export function AttendancePage() {
  const [activeTab, setActiveTab] = useState<"call" | "history">("call");

  // Selection states for Roll Call ("call" tab)
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("none");
  const [callStarted, setCallStarted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Selection states for History ("history" tab)
  const [historyClassId, setHistoryClassId] = useState<string>("all");
  const [historySubjectId, setHistorySubjectId] = useState<string>("all");
  const [historyStatus, setHistoryStatus] = useState<string>("all");
  const [historyDateFrom, setHistoryDateFrom] = useState<string>("");
  const [historyDateTo, setHistoryDateTo] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Load selection lists
  const { data: classroomsData } = useClassrooms({ per_page: 100 });
  const { data: subjectsData } = useSubjects({ per_page: 100 });
  const { data: assignedOptions } = useTeacherAssignedOptions();

  const isRestricted = assignedOptions?.isRestricted ?? false;
  const classrooms = isRestricted
    ? (assignedOptions?.classrooms ?? [])
    : (classroomsData?.data ?? []);
  const subjects = isRestricted
    ? (assignedOptions?.subjects ?? [])
    : (subjectsData?.data ?? []);

  const isEnabled = callStarted && selectedClassId !== "all" && !!selectedDate;

  // Fetch sheet only when call is started
  const {
    data: attendanceData,
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
  const deleteSession = useDeleteAttendanceSession();
  const deleteRecord = useDeleteAttendanceRecord();

  // History query
  const { data: logsData, isLoading: loadingLogs } = useAttendanceLogs(
    {
      classroomId: historyClassId,
      subjectId: historySubjectId,
      status: historyStatus,
      dateFrom: historyDateFrom || undefined,
      dateTo: historyDateTo || undefined,
    },
    activeTab === "history"
  );

  const logsList = logsData ?? [];
  const filteredLogs = logsList.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.student_name.toLowerCase().includes(q) ||
      log.student_number.toLowerCase().includes(q)
    );
  });

  // Local state to keep sheet inputs
  const [localSheet, setLocalSheet] = useState<(AttendanceItemInput & { _saved?: boolean })[]>([]);

  // Sync when data loads
  useEffect(() => {
    if (attendanceData && attendanceData.length > 0) {
      setLocalSheet(
        attendanceData.map((a) => ({
          student_id: a.student_id,
          status: a.status,
          justification: a.justification || "",
          _saved: !!a.id,
        }))
      );
    } else {
      setLocalSheet([]);
    }
  }, [attendanceData]);

  // Reset call state when filters change
  useEffect(() => {
    setCallStarted(false);
    setLocalSheet([]);
    setConfirmDelete(false);
  }, [selectedClassId, selectedDate, selectedSubjectId]);

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

  const handleMarkAllPresent = () => {
    setLocalSheet((prev) => prev.map((item) => ({ ...item, status: "present" })));
  };

  // Roll Call Statistics
  const totalStudents = localSheet.length;
  const presentCount = localSheet.filter((s) => s.status === "present").length;
  const absentCount = localSheet.filter((s) => s.status === "absent").length;
  const lateCount = localSheet.filter((s) => s.status === "late").length;
  const presenceRate = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(0) : "0";

  const canStartCall = selectedClassId !== "all" && !!selectedDate;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feuille d'Appel & Présences"
        description="Enregistrez la présence des élèves par cours ou consultez l'historique d'assiduité."
        icon={UserCheck}
      />

      {/* Tabs navigation */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("call")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === "call"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <UserCheck className="size-4" />
          Feuille d'Appel (Saisie)
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === "history"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <History className="size-4" />
          Historique & Consultation
        </button>
      </div>

      {/* TAB 1: FEUILLE D'APPEL */}
      {activeTab === "call" && (
        <div className="space-y-6">
          {/* Selectors + Start button */}
          <div className="bg-card p-4 rounded-xl border space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="att-class">Classe</Label>
                <select
                  id="att-class"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="att-subj">Matière / Cours (Optionnel)</Label>
                <select
                  id="att-subj"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
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

            {!callStarted && (
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  disabled={!canStartCall}
                  onClick={() => setCallStarted(true)}
                  className="bg-brand-500 hover:bg-brand-600 text-slate-950 dark:text-white font-semibold gap-2"
                >
                  <PlayCircle className="size-4" />
                  Faire l'appel
                </Button>
              </div>
            )}
          </div>

          {/* Error state */}
          {isError && (
            <div className="rounded-xl border border-rose-400 bg-rose-500/10 p-4 text-sm text-rose-600 font-medium">
              ⚠️ {(error as Error)?.message ?? "Erreur lors du chargement de la feuille d'appel."}
            </div>
          )}

          {/* Sheet content */}
          {callStarted && !isError && (
            <>
              {/* Statistics Cards */}
              {attendanceData && attendanceData.length > 0 && (
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
                      <div className="text-2xl font-bold text-emerald-500">{presentCount} / {totalStudents}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Absents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-rose-500">{absentCount}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">En retard</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-500">{lateCount}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Roll Call Sheet */}
              <div className="bg-card rounded-xl border overflow-hidden">
                <form onSubmit={handleSave}>
                  {/* Toolbar */}
                  <div className="p-4 border-b bg-muted/30 flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                      <Button type="button" variant="outline" size="sm" onClick={handleMarkAllPresent} className="text-xs">
                        Tout marquer comme présent
                      </Button>

                      {!confirmDelete ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDelete(true)}
                          className="text-xs text-rose-500 border-rose-400 hover:bg-rose-500/10 gap-1.5"
                        >
                          <Trash2 className="size-3" /> Supprimer la feuille d'appel
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-rose-600 font-semibold">
                          <AlertTriangle className="size-3.5" />
                          Confirmer la suppression ?
                          <Button
                            type="button"
                            size="sm"
                            className="bg-rose-500 hover:bg-rose-600 text-white text-xs h-7 px-3"
                            disabled={deleteSession.isPending}
                            onClick={() => {
                              deleteSession.mutate(
                                {
                                  classroomId: selectedClassId,
                                  date: selectedDate,
                                  subjectId: selectedSubjectId === "none" ? null : selectedSubjectId,
                                },
                                { onSettled: () => setConfirmDelete(false) }
                              );
                            }}
                          >
                            {deleteSession.isPending ? <Loader2 className="size-3 animate-spin" /> : "Oui, supprimer"}
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="text-xs h-7" onClick={() => setConfirmDelete(false)}>
                            Annuler
                          </Button>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={saveAttendance.isPending || localSheet.length === 0}
                      className="bg-brand-500 hover:bg-brand-600 gap-1.5 h-8 text-xs"
                    >
                      {saveAttendance.isPending ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                      Enregistrer l'appel
                    </Button>
                  </div>

                  {/* Table */}
                  {loadingSheet ? (
                    <div className="p-12 flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="size-5 animate-spin text-brand-500" />
                      <span className="text-sm">Chargement des élèves…</span>
                    </div>
                  ) : attendanceData && attendanceData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b bg-muted/10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <th className="p-4">Matricule</th>
                            <th className="p-4">Nom de l'élève</th>
                            <th className="p-4 w-36">Statut</th>
                            <th className="p-4">Actions</th>
                            <th className="p-4">Justification</th>
                            <th className="p-4 text-right w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {attendanceData.map((a) => {
                            const localItem = localSheet.find((l) => l.student_id === a.student_id);
                            const currentStatus = localItem?.status ?? null;
                            const justification = localItem?.justification ?? "";
                            const statusInfo = currentStatus ? STATUS_LABELS[currentStatus] : null;

                            return (
                              <tr key={a.student_id} className="hover:bg-muted/5 transition-colors">
                                <td className="p-4 font-mono text-xs text-muted-foreground">
                                  {a.student?.student_number}
                                </td>

                                <td className="p-4 font-semibold text-foreground">
                                  {a.student?.user?.name}
                                </td>

                                <td className="p-4">
                                  {statusInfo ? (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
                                      {statusInfo.label}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/50 text-xs font-mono">———</span>
                                  )}
                                </td>

                                <td className="p-4">
                                  <div className="flex rounded-md border p-0.5 bg-muted/30 w-fit gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(a.student_id, "present")}
                                      className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${currentStatus === "present"
                                          ? "bg-emerald-500 text-white shadow-sm"
                                          : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                      <Check className="size-3" /> Présent
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(a.student_id, "absent")}
                                      className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${currentStatus === "absent"
                                          ? "bg-rose-500 text-white shadow-sm"
                                          : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                      <X className="size-3" /> Absent
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(a.student_id, "late")}
                                      className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${currentStatus === "late"
                                          ? "bg-amber-500 text-white shadow-sm"
                                          : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                      <Clock className="size-3" /> Retard
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(a.student_id, "excused")}
                                      className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${currentStatus === "excused"
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
                                    value={justification}
                                    onChange={(e) => handleJustificationChange(a.student_id, e.target.value)}
                                    placeholder="ex: Certificat médical, Retard bus..."
                                    className="w-full h-8 text-xs bg-muted/30"
                                    disabled={currentStatus === "present" || currentStatus === null}
                                  />
                                </td>

                                <td className="p-4 text-right">
                                  {a.id && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      disabled={deleteRecord.isPending}
                                      onClick={() => deleteRecord.mutate(a.id)}
                                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 h-8 w-8 p-0"
                                      title="Supprimer cette présence"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 flex flex-col items-center justify-center text-center gap-2">
                      <BookOpen className="size-8 text-muted-foreground stroke-1" />
                      <p className="text-sm font-semibold text-foreground">Aucun élève trouvé</p>
                      <p className="text-xs text-muted-foreground">Cette classe ne contient aucun élève actif.</p>
                    </div>
                  )}
                </form>
              </div>
            </>
          )}

          {!callStarted && (
            <div className="flex flex-col items-center justify-center py-20 border rounded-xl bg-card border-dashed gap-3">
              <BookOpen className="size-10 text-muted-foreground stroke-1 animate-pulse" />
              <p className="font-semibold text-sm text-foreground">Feuille d'appel non chargée</p>
              <p className="text-xs text-muted-foreground max-w-sm text-center">
                Sélectionnez une <strong>classe</strong> et une <strong>date</strong> puis cliquez sur <strong>Faire l'appel</strong>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTORIQUE & CONSULTATION */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-card p-4 rounded-xl border space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {/* Classe */}
              <div className="space-y-1.5">
                <Label className="text-xs">Classe</Label>
                <select
                  value={historyClassId}
                  onChange={(e) => setHistoryClassId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-900 dark:text-white"
                >
                  <option value="all">Toutes les classes</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Matière */}
              <div className="space-y-1.5">
                <Label className="text-xs">Matière / Cours</Label>
                <select
                  value={historySubjectId}
                  onChange={(e) => setHistorySubjectId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-900 dark:text-white"
                >
                  <option value="all">Toutes les matières</option>
                  <option value="none">Présence Journalière</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div className="space-y-1.5">
                <Label className="text-xs">Statut</Label>
                <select
                  value={historyStatus}
                  onChange={(e) => setHistoryStatus(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-slate-900 dark:text-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="present">Présent</option>
                  <option value="absent">Absent</option>
                  <option value="late">Retard</option>
                  <option value="excused">Justifié</option>
                </select>
              </div>

              {/* Date début */}
              <div className="space-y-1.5">
                <Label className="text-xs">Date de début</Label>
                <Input
                  type="date"
                  value={historyDateFrom}
                  onChange={(e) => setHistoryDateFrom(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Date fin */}
              <div className="space-y-1.5">
                <Label className="text-xs">Date de fin</Label>
                <Input
                  type="date"
                  value={historyDateTo}
                  onChange={(e) => setHistoryDateTo(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un élève par nom ou matricule..."
                className="pl-9 text-xs h-9"
              />
            </div>
          </div>

          {/* History List */}
          <div className="bg-card rounded-xl border overflow-hidden">
            {loadingLogs ? (
              <div className="p-12 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-brand-500" />
                <span className="text-sm">Chargement du journal d'assiduité…</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center gap-2">
                <History className="size-10 text-muted-foreground stroke-1" />
                <p className="text-sm font-semibold text-foreground">Aucun enregistrement d'assiduité trouvé</p>
                <p className="text-xs text-muted-foreground">
                  Modifiez les filtres de recherche ci-dessus pour consulter l'historique des présences.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="p-4">Date</th>
                      <th className="p-4">Matricule</th>
                      <th className="p-4">Nom de l'élève</th>
                      <th className="p-4">Classe</th>
                      <th className="p-4">Cours / Matière</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4">Justification</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredLogs.map((log) => {
                      const statusInfo = STATUS_LABELS[log.status];
                      return (
                        <tr key={log.id} className="hover:bg-muted/5 transition-colors">
                          <td className="p-4 font-mono text-xs text-foreground font-semibold">
                            {new Date(log.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="p-4 font-mono text-xs text-muted-foreground">
                            {log.student_number}
                          </td>
                          <td className="p-4 font-semibold text-foreground">
                            {log.student_name}
                          </td>
                          <td className="p-4 text-xs font-medium text-muted-foreground">
                            {log.classroom_name}
                          </td>
                          <td className="p-4 text-xs font-medium text-foreground">
                            {log.subject_name}
                          </td>
                          <td className="p-4">
                            {statusInfo ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="p-4 text-xs italic text-muted-foreground">
                            {log.justification || "—"}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={deleteRecord.isPending}
                              onClick={() => deleteRecord.mutate(log.id)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 h-8 w-8 p-0"
                              title="Supprimer cet enregistrement"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
