"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/common/page-header";
import { FileText, Printer, Search, GraduationCap, Building, Award, CheckCircle, AlertCircle, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useClassrooms } from "@/features/classrooms/hooks/use-classrooms";
import { useStudents } from "@/features/students/hooks/use-students";
import { useOwnerStore } from "@/store/owner-store";
import { Badge } from "@/components/ui/badge";

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

  // Load students for selected classroom
  const { data: studentsData, isLoading: studentsLoading } = useStudents({
    classroom_id: selectedClassroomId || undefined,
  });
  const students = studentsData?.data ?? [];

  const activeClassroomName = classrooms.find(c => c.id === selectedClassroomId)?.name || "Classe";

  // Compute student list with averages & rankings
  const processedStudents = useMemo(() => {
    if (!students || students.length === 0) return [];
    
    // Generate deterministic or database-derived averages for demo
    const list = students.map((s, idx) => {
      const sName = s.user?.name || "Élève";
      // Create a deterministic average based on student name length/id
      const avgSeed = (sName.charCodeAt(0) + sName.charCodeAt(sName.length - 1)) % 10;
      const average = Number((10.5 + (avgSeed * 0.9) - (idx * 0.15)).toFixed(2));
      
      return {
        ...s,
        average: Math.min(20, Math.max(7, average)),
        rank: idx + 1, // temporary rank based on index
      };
    });

    // Sort by average descending
    list.sort((a, b) => b.average - a.average);

    // Reassign ranks
    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [students]);

  // Filtered student list by search query
  const filteredStudents = useMemo(() => {
    return processedStudents.filter((s) =>
      (s.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_number.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [processedStudents, searchQuery]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const getStatusBadge = (avg: number) => {
    if (avg >= 12) return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Admis</Badge>;
    if (avg >= 10) return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Admis (Passable)</Badge>;
    return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20">Blâmé</Badge>;
  };

  // Detailed mock report card matrix
  const reportMatrix = useMemo(() => {
    if (!activeReportStudent) return [];
    const seed = activeReportStudent.average;
    return [
      { subject: "Mathématiques", coef: 4, average: Math.min(20, Math.round(seed + 1.5)), classMax: 18, classMin: 6, appreciation: "Très bon travail. Régulier." },
      { subject: "Physique-Chimie", coef: 3, average: Math.min(20, Math.round(seed + 2.0)), classMax: 17, classMin: 7, appreciation: "Excellent esprit d'analyse." },
      { subject: "Français", coef: 3, average: Math.max(0, Math.round(seed - 1.5)), classMax: 15, classMin: 8, appreciation: "Doit s'investir davantage à l'écrit." },
      { subject: "Anglais", coef: 2, average: Math.min(20, Math.round(seed + 0.5)), classMax: 16, classMin: 9, appreciation: "Bonne participation orale." },
      { subject: "Histoire-Géographie", coef: 2, average: Math.min(20, Math.round(seed - 0.2)), classMax: 15, classMin: 8, appreciation: "Ensemble satisfaisant." },
      { subject: "SVT", coef: 2, average: Math.min(20, Math.round(seed + 0.8)), classMax: 17, classMin: 7, appreciation: "Résultats solides." },
      { subject: "EPS", coef: 1, average: 15, classMax: 18, classMin: 10, appreciation: "Bonne aptitude physique." },
    ];
  }, [activeReportStudent]);

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
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {classroomsLoading ? (
              <option>Chargement...</option>
            ) : (
              classrooms.map((c) => (
                <option key={c.id} value={c.id}>
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
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="T1">Trimestre 1</option>
            <option value="T2">Trimestre 2</option>
            <option value="T3">Trimestre 3</option>
            <option value="AN">Annuel</option>
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
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
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
                <thead className="text-xs text-white uppercase bg-muted/20">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-center">Rang</th>
                    <th className="px-4 py-3 font-semibold">Élève</th>
                    <th className="px-4 py-3 font-semibold text-center">Matricule</th>
                    <th className="px-4 py-3 font-semibold text-center">Moyenne générale</th>
                    <th className="px-4 py-3 font-semibold text-center">Décision</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-4 py-3 text-center font-bold text-foreground">
                        {s.rank === 1 ? (
                          <span className="inline-flex items-center gap-1 text-yellow-500">
                            <Award className="w-4 h-4 fill-yellow-500/20" /> 1er
                          </span>
                        ) : (
                          `${s.rank}e`
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{s.user?.name || "Élève sans nom"}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs">{s.student_number}</td>
                      <td className="px-4 py-3 text-center font-bold text-white">{s.average} /20</td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(s.average)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveReportStudent(s)}
                          className="text-xs hover:bg-brand-500/10 hover:text-white"
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
        <DialogContent className="max-w-4xl bg-slate-900 border-border/50 text-white max-h-[90vh] overflow-y-auto print:p-0 print:border-0 print:bg-white print:text-black">
          {activeReportStudent && (
            <div className="space-y-6">
              {/* Print action header */}
              <div className="flex justify-between items-center border-b pb-4 print:hidden">
                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-400" /> Aperçu du Bulletin Officiel
                </DialogTitle>
                <div className="flex gap-2">
                  <Button onClick={handlePrint} className="bg-brand-500 hover:bg-brand-600 text-white font-sans text-xs gap-2">
                    <Printer className="w-4 h-4" /> Imprimer le bulletin
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setActiveReportStudent(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* REPORT CARD CONTAINER (designed for print representation) */}
              <div className="p-8 bg-card rounded-xl border border-border/50 space-y-6 print:border-0 print:p-0 print:bg-white print:text-black print:shadow-none">
                {/* School Header */}
                <div className="flex justify-between items-start border-b border-border/60 pb-4">
                  <div className="text-xs uppercase space-y-1 font-semibold">
                    <p>République du Cameroun</p>
                    <p>Paix - Travail - Patrie</p>
                    <p className="text-muted-foreground font-sans text-[10px] print:text-gray-500">Ministère des Enseignements Secondaires</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-lg bg-brand-gradient flex items-center justify-center font-bold text-white text-lg">
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
                  <h2 className="text-xl font-bold uppercase tracking-widest text-white border-b-2 border-primary/20 inline-block pb-1 print:text-black print:border-black">
                    Bulletin Trimestriel de Notes
                  </h2>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-2 gap-6 text-sm bg-muted/20 p-4 rounded-lg border print:bg-gray-100 print:text-black">
                  <div className="space-y-1.5">
                    <p><span className="text-muted-foreground print:text-gray-600 font-semibold">Nom de l'élève :</span> <strong className="text-white print:text-black">{activeReportStudent.user?.name || "Élève sans nom"}</strong></p>
                    <p><span className="text-muted-foreground print:text-gray-600 font-semibold">Classe :</span> <strong className="text-white print:text-black">{activeClassroomName}</strong></p>
                  </div>
                  <div className="space-y-1.5 text-right print:text-right">
                    <p><span className="text-muted-foreground print:text-gray-600 font-semibold">Matricule :</span> <span className="font-mono text-white print:text-black font-bold">{activeReportStudent.student_number}</span></p>
                    <p><span className="text-muted-foreground print:text-gray-600 font-semibold">Rang :</span> <strong className="text-white print:text-black">{activeReportStudent.rank}er / {students.length}</strong></p>
                  </div>
                </div>

                {/* Grades Matrix */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-collapse border-border print:border-black">
                    <thead className="bg-muted/30 uppercase text-white font-bold print:bg-gray-200 print:text-black">
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
                          <td className="px-3 py-2 border-r font-semibold text-white print:text-black">{m.subject}</td>
                          <td className="px-3 py-2 border-r text-center">{m.coef}</td>
                          <td className="px-3 py-2 border-r text-center font-bold text-white print:text-black">{m.average} /20</td>
                          <td className="px-3 py-2 border-r text-center">{m.classMin}</td>
                          <td className="px-3 py-2 border-r text-center">{m.classMax}</td>
                          <td className="px-3 py-2 italic text-muted-foreground print:text-gray-600">{m.appreciation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Box */}
                <div className="grid grid-cols-3 gap-4 border-t border-border/60 pt-6">
                  <div className="p-3 border rounded-lg bg-muted/15 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold print:text-gray-500">Moyenne Générale</span>
                    <span className="text-xl font-bold text-white print:text-black mt-1">{activeReportStudent.average} /20</span>
                  </div>
                  <div className="p-3 border rounded-lg bg-muted/15 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold print:text-gray-500">Mention & Décision</span>
                    <span className="text-sm font-bold text-emerald-400 mt-1">{activeReportStudent.average >= 10 ? "ADMIS" : "BLÂMÉ"}</span>
                  </div>
                  <div className="p-3 border rounded-lg bg-muted/15 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold print:text-gray-500">Assiduité</span>
                    <span className="text-sm font-bold text-white print:text-black mt-1">Aucune absence</span>
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
