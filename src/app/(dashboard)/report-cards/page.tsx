"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/common/page-header";
import { FileText, Printer, Search, GraduationCap, Award, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useClassrooms } from "@/features/classrooms/hooks/use-classrooms";
import { useOwnerStore } from "@/store/owner-store";
import { Badge } from "@/components/ui/badge";

import { getClassroomAveragesAction, getStudentReportCardDetailsAction } from "@/features/grades/actions";
import { getAttendanceSummaryAction } from "@/features/attendance/actions";
import { useQuery } from "@tanstack/react-query";

export default function ReportCardsPage() {
  const { selectedEstablishmentId } = useOwnerStore();

  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("T1");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeReportStudent, setActiveReportStudent] = useState<any | null>(null);

  // Load classrooms
  const { data: classroomsData, isLoading: classroomsLoading } = useClassrooms();
  const classrooms = classroomsData?.data ?? [];

  // Set first classroom as default when loaded
  useMemo(() => {
    if (classrooms.length > 0 && !selectedClassroomId) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  // Load REAL averages calculated by PostgreSQL for the selected classroom & term
  const { data: averagesData, isLoading: studentsLoading } = useQuery({
    queryKey: ["classroom-averages", selectedClassroomId, selectedTerm, selectedEstablishmentId],
    queryFn: async () => {
      if (!selectedClassroomId) return [];
      const res = await getClassroomAveragesAction(selectedClassroomId, selectedTerm, selectedEstablishmentId || undefined);
      if (res.error) throw new Error(res.error);
      return res.data ?? [];
    },
    enabled: !!selectedClassroomId,
  });

  const activeClassroomName = classrooms.find((c) => c.id === selectedClassroomId)?.name || "Classe";

  const processedStudents = useMemo(() => {
    return (averagesData ?? []).map((s) => ({
      id: s.student_id,
      student_number: s.student_number,
      user: { name: s.student_name },
      average: s.average,
      rank: s.rank,
      mention: s.mention,
    }));
  }, [averagesData]);

  // Filtered student list by search query
  const filteredStudents = useMemo(() => {
    return processedStudents.filter(
      (s) =>
        (s.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student_number.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [processedStudents, searchQuery]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const getStatusBadge = (avg: number | null) => {
    if (avg === null) return <Badge variant="outline" className="text-muted-foreground border-border">Non évalué</Badge>;
    if (avg >= 12) return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Admis</Badge>;
    if (avg >= 10) return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Admis (Passable)</Badge>;
    return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">Blâmé</Badge>;
  };

  // Detailed real report card matrix per subject
  const { data: reportMatrixData } = useQuery({
    queryKey: ["student-report-matrix", activeReportStudent?.id, selectedClassroomId, selectedTerm, selectedEstablishmentId],
    queryFn: async () => {
      if (!activeReportStudent?.id || !selectedClassroomId) return [];
      const res = await getStudentReportCardDetailsAction(
        activeReportStudent.id,
        selectedClassroomId,
        selectedTerm,
        selectedEstablishmentId || undefined
      );
      if (res.error) throw new Error(res.error);
      return res.data ?? [];
    },
    enabled: !!activeReportStudent?.id && !!selectedClassroomId,
  });

  const reportMatrix = reportMatrixData ?? [];

  // Detailed attendance summary for active student
  const { data: attendanceSummary } = useQuery({
    queryKey: ["student-attendance-summary", activeReportStudent?.id, selectedEstablishmentId],
    queryFn: async () => {
      if (!activeReportStudent?.id) return null;
      const res = await getAttendanceSummaryAction(activeReportStudent.id, undefined, undefined, selectedEstablishmentId || undefined);
      if (res.error) return null;
      return res.data ?? null;
    },
    enabled: !!activeReportStudent?.id,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulletins & Relevés de Notes"
        description="Générez, consultez et imprimez les bulletins de notes trimestriels pour l'ensemble des élèves."
        icon={FileText}
      />

      {/* Selectors card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Classroom select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground font-semibold uppercase">Classe</label>
          <select
            value={selectedClassroomId}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {classroomsLoading ? (
              <option className="bg-background text-foreground">Chargement...</option>
            ) : (
              classrooms.map((c) => (
                <option key={c.id} value={c.id} className="bg-background text-foreground">
                  {c.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Term select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground font-semibold uppercase">Période</label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="T1" className="bg-background text-foreground">Trimestre 1</option>
            <option value="T2" className="bg-background text-foreground">Trimestre 2</option>
            <option value="T3" className="bg-background text-foreground">Trimestre 3</option>
            <option value="AN" className="bg-background text-foreground">Annuel</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground font-semibold uppercase">Rechercher</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un élève par nom ou matricule..."
              className="pl-9 bg-card border-border"
            />
          </div>
        </div>
      </div>

      {/* Main Student list card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" /> Bulletins scolaires - {activeClassroomName} ({selectedTerm})
          </CardTitle>
          <CardDescription>Consultez les résultats de la classe triés par moyenne générale.</CardDescription>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="py-20 text-center text-muted-foreground animate-pulse">Chargement des élèves...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">Aucun élève trouvé pour cette sélection.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-muted-foreground">
                <thead className="text-xs text-foreground uppercase bg-muted/40 border-b border-border font-bold">
                  <tr>
                    <th className="px-4 py-3 font-bold text-center">Rang</th>
                    <th className="px-4 py-3 font-bold">Élève</th>
                    <th className="px-4 py-3 font-bold text-center">Matricule</th>
                    <th className="px-4 py-3 font-bold text-center">Moyenne générale</th>
                    <th className="px-4 py-3 font-bold text-center">Décision</th>
                    <th className="px-4 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 text-center font-bold text-foreground">
                        {s.rank === 1 ? (
                          <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                            <Award className="w-4 h-4 fill-amber-500/20" /> 1er
                          </span>
                        ) : s.rank ? (
                          `${s.rank}e`
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{s.user?.name || "Élève sans nom"}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-foreground">{s.student_number}</td>
                      <td className="px-4 py-3 text-center font-bold text-foreground">
                        {s.average !== null ? `${s.average} /20` : "Non évalué"}
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(s.average)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveReportStudent(s)}
                          className="text-xs font-semibold"
                        >
                          Voir le bulletin
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Detailed Bulletin Modal */}
      <Dialog open={!!activeReportStudent} onOpenChange={() => setActiveReportStudent(null)}>
        <DialogContent className="max-w-7xl! bg-card border-border text-foreground max-h-[90vh] overflow-y-auto print:p-0 print:border-0 print:bg-white print:text-black">
          {activeReportStudent && (
            <div className="space-y-6">
              {/* Print action header */}
              <div className="flex justify-between items-center border-b border-border pb-4 print:hidden">
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-500" /> Aperçu du Bulletin Officiel
                </DialogTitle>
                <div className="flex gap-2">
                  <Button onClick={handlePrint} className="bg-brand-500 hover:bg-brand-600 text-slate-950 dark:text-white font-semibold text-xs gap-2">
                    <Printer className="w-4 h-4" /> Imprimer le bulletin
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setActiveReportStudent(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* REPORT CARD CONTAINER (designed for print representation) */}
              <div className="p-8 bg-card rounded-xl border border-border space-y-6 print:border-0 print:p-0 print:bg-white print:text-black print:shadow-none">
                {/* School Header */}
                <div className="flex justify-between items-start border-b border-border pb-4">
                  <div className="text-xs uppercase space-y-1 font-semibold">
                    <p>République du Cameroun</p>
                    <p>Paix - Travail - Patrie</p>
                    <p className="text-muted-foreground font-sans text-[10px] print:text-gray-500">Ministère des Enseignements Secondaires</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-lg bg-brand-500 text-slate-950 font-bold flex items-center justify-center text-lg">
                      E
                    </div>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1 tracking-wider print:text-gray-500">Etarcos Etab</p>
                  </div>
                  <div className="text-xs uppercase text-right space-y-1 font-semibold">
                    <p>Année Scolaire : 2025 - 2026</p>
                    <p>Période : {selectedTerm === "T1" ? "1er Trimestre" : selectedTerm === "T2" ? "2e Trimestre" : "3e Trimestre"}</p>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center">
                  <h2 className="text-xl font-bold uppercase tracking-widest text-foreground border-b-2 border-primary/20 inline-block pb-1 print:text-black print:border-black">
                    Bulletin Trimestriel de Notes
                  </h2>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-2 gap-6 text-sm bg-muted/30 p-4 rounded-lg border border-border print:bg-gray-100 print:text-black">
                  <div className="space-y-1.5">
                    <p><span className="text-muted-foreground print:text-gray-600 font-semibold">Nom de l'élève :</span> <strong className="text-foreground print:text-black">{activeReportStudent.user?.name || "Élève sans nom"}</strong></p>
                    <p><span className="text-muted-foreground print:text-gray-600 font-semibold">Classe :</span> <strong className="text-foreground print:text-black">{activeClassroomName}</strong></p>
                  </div>
                  <div className="space-y-1.5 text-right print:text-right">
                    <p><span className="text-muted-foreground print:text-gray-600 font-semibold">Matricule :</span> <span className="font-mono text-foreground print:text-black font-bold">{activeReportStudent.student_number}</span></p>
                    <p><span className="text-muted-foreground print:text-gray-600 font-semibold">Rang :</span> <strong className="text-foreground print:text-black">{activeReportStudent.rank}er / {processedStudents.length}</strong></p>
                  </div>
                </div>

                {/* Grades Matrix */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-collapse border-border print:border-black">
                    <thead className="bg-muted/40 uppercase text-foreground font-bold print:bg-gray-200 print:text-black">
                      <tr className="border-b border-border print:border-black">
                        <th className="px-3 py-2 border-r border-border print:border-black">Discipline / Matière</th>
                        <th className="px-3 py-2 border-r border-border text-center print:border-black">Coef</th>
                        <th className="px-3 py-2 border-r border-border text-center print:border-black">Moyenne</th>
                        <th className="px-3 py-2 border-r border-border text-center print:border-black">Min</th>
                        <th className="px-3 py-2 border-r border-border text-center print:border-black">Max</th>
                        <th className="px-3 py-2">Appréciation pédagogique</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border print:divide-black">
                      {reportMatrix.map((m, idx) => (
                        <tr key={idx} className="print:text-black">
                          <td className="px-3 py-2 border-r font-semibold text-foreground print:text-black">{m.subject}</td>
                          <td className="px-3 py-2 border-r text-center">{m.coef}</td>
                          <td className="px-3 py-2 border-r text-center font-bold text-foreground print:text-black">{m.average !== null ? `${m.average} /20` : "—"}</td>
                          <td className="px-3 py-2 border-r text-center">{m.classMin !== null ? `${m.classMin} /20` : "—"}</td>
                          <td className="px-3 py-2 border-r text-center">{m.classMax !== null ? `${m.classMax} /20` : "—"}</td>
                          <td className="px-3 py-2 italic text-muted-foreground print:text-gray-600">{m.appreciation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Box */}
                <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
                  <div className="p-3 border rounded-lg bg-muted/20 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold print:text-gray-500">Moyenne Générale</span>
                    <span className="text-xl font-bold text-foreground print:text-black mt-1">{activeReportStudent.average} /20</span>
                  </div>
                  <div className="p-3 border rounded-lg bg-muted/20 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold print:text-gray-500">Mention & Décision</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeReportStudent.average >= 10 ? "ADMIS" : "BLÂMÉ"}</span>
                  </div>
                  <div className="p-3 border rounded-lg bg-muted/20 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold print:text-gray-500">Assiduité</span>
                    <span className="text-sm font-bold text-foreground print:text-black mt-1">
                      {attendanceSummary
                        ? attendanceSummary.total_absences === 0 && attendanceSummary.total_late === 0
                          ? "Aucune absence"
                          : `${attendanceSummary.total_absences} abs. ${attendanceSummary.total_late > 0 ? `/ ${attendanceSummary.total_late} ret.` : ""}`
                        : "Aucune absence"}
                    </span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 pt-10 text-xs font-semibold">
                  <div>
                    <p className="underline uppercase tracking-wider">Le Censeur des Études</p>
                    <p className="mt-8 text-muted-foreground/60 italic print:text-gray-400">Signature & Cachet</p>
                  </div>
                  <div className="text-right">
                    <p className="underline uppercase tracking-wider">Le Principal / Proviseur</p>
                    <p className="mt-8 text-muted-foreground/60 italic print:text-gray-400">Signature & Cachet</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
