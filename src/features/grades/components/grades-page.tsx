"use client";

import { useEffect, useState, useTransition } from "react";
import { Award, BookOpen, Save, Loader2, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useClassrooms } from "@/features/classrooms";
import { useSubjects } from "@/features/subjects";
import { useClassroomGrades, useSaveGrades } from "../hooks/use-grades";
import type { GradeEntryItem } from "../schemas";

type PeriodType = "T1" | "T2" | "T3" | "S1" | "S2";
type EvalType = "test" | "exam" | "homework" | "oral" | "practical";

export function GradesPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("T1");
  const [selectedType, setSelectedType] = useState<EvalType>("test");

  const [coef, setCoef] = useState<number>(1);
  const [maxValue, setMaxValue] = useState<number>(20);

  // Load classrooms and subjects
  const { data: classroomsData } = useClassrooms({ per_page: 100 });
  const { data: subjectsData } = useSubjects({ per_page: 100 });

  const classrooms = classroomsData?.data ?? [];
  const subjects = subjectsData?.data ?? [];

  // Query actual grades or initial student list
  const isEnabled = selectedClassId !== "all" && selectedSubjectId !== "all";
  const {
    data: gradesData = [],
    isLoading: loadingGrades,
    isError,
    error,
  } = useClassroomGrades(
    selectedClassId,
    selectedSubjectId,
    selectedPeriod,
    selectedType,
    isEnabled
  );

  const saveGrades = useSaveGrades();

  // Local state to keep modified grades input
  const [localGrades, setLocalGrades] = useState<GradeEntryItem[]>([]);

  // Update local inputs when database values load
  useEffect(() => {
    if (gradesData.length > 0) {
      setLocalGrades(
        gradesData.map((g) => ({
          student_id: g.student_id,
          value: Number(g.value),
          comment: g.comment || "",
        }))
      );
      if (gradesData[0]) {
        setCoef(Number(gradesData[0].coefficient || 1));
        setMaxValue(Number(gradesData[0].max_value || 20));
      }
    } else {
      setLocalGrades([]);
    }
  }, [gradesData]);

  const handleGradeChange = (studentId: string, val: string) => {
    let num = parseFloat(val);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > maxValue) num = maxValue;

    setLocalGrades((prev) =>
      prev.map((g) => (g.student_id === studentId ? { ...g, value: num } : g))
    );
  };

  const handleCommentChange = (studentId: string, comment: string) => {
    setLocalGrades((prev) =>
      prev.map((g) => (g.student_id === studentId ? { ...g, comment } : g))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClassId === "all" || selectedSubjectId === "all") return;

    await saveGrades.mutateAsync({
      classroom_id: selectedClassId,
      subject_id: selectedSubjectId,
      period: selectedPeriod,
      type: selectedType,
      coefficient: coef,
      max_value: maxValue,
      grades: localGrades,
    });
  };

  // Math Statistics
  const validMarks = localGrades.map((g) => g.value);
  const average =
    validMarks.length > 0
      ? (validMarks.reduce((acc, val) => acc + val, 0) / validMarks.length).toFixed(2)
      : "N/A";
  const minGrade = validMarks.length > 0 ? Math.min(...validMarks).toFixed(1) : "N/A";
  const maxGrade = validMarks.length > 0 ? Math.max(...validMarks).toFixed(1) : "N/A";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes & Bulletins"
        description="Saisissez et modifiez les notes académiques des élèves par classe et matière."
        icon={Award}
      />

      {/* Selectors grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card p-4 rounded-xl border">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Classe</label>
          <select
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
          <label className="text-xs font-semibold text-muted-foreground">Matière</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">Sélectionner une matière...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Période Évaluée</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as PeriodType)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="T1">Trimestre 1</option>
            <option value="T2">Trimestre 2</option>
            <option value="T3">Trimestre 3</option>
            <option value="S1">Semestre 1</option>
            <option value="S2">Semestre 2</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Type d'Évaluation</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as EvalType)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="test">Contrôle Continu</option>
            <option value="exam">Examen Trimestriel</option>
            <option value="homework">Devoir à la Maison</option>
            <option value="oral">Interrogation Orale</option>
            <option value="practical">Travaux Pratiques (TP)</option>
          </select>
        </div>
      </div>

      {isEnabled && !isError && gradesData.length > 0 && (
        <>
          {/* Quick Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Moyenne de classe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-500">
                  {average} / {maxValue}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Note la plus basse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-500">
                  {minGrade} / {maxValue}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Note la plus haute</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  {maxGrade} / {maxValue}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration and Grades Entry */}
          <div className="bg-card rounded-xl border overflow-hidden">
            <form onSubmit={handleSave}>
              <div className="p-4 border-b bg-muted/30 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="grades-coef" className="text-xs font-semibold text-muted-foreground">Coefficient :</Label>
                    <Input
                      id="grades-coef"
                      type="number"
                      value={coef}
                      onChange={(e) => setCoef(parseFloat(e.target.value) || 1)}
                      className="w-16 h-8 font-mono text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="grades-maxval" className="text-xs font-semibold text-muted-foreground">Sur :</Label>
                    <Input
                      id="grades-maxval"
                      type="number"
                      value={maxValue}
                      onChange={(e) => setMaxValue(parseInt(e.target.value) || 20)}
                      className="w-16 h-8 font-mono text-xs"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saveGrades.isPending} className="bg-brand-500 hover:bg-brand-600 text-white gap-1.5 h-8 text-xs font-sans">
                  {saveGrades.isPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Save className="size-3" />
                  )}
                  Enregistrer les notes
                </Button>
              </div>

              {loadingGrades ? (
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
                        <th className="p-4 w-[160px]">Note obtenus</th>
                        <th className="p-4 w-[160px]">Mention / Appréciation</th>
                        <th className="p-4">Commentaire / Remarque</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {gradesData.map((g) => {
                        const localItem = localGrades.find((l) => l.student_id === g.student_id);
                        const val = localItem ? localItem.value : 0;
                        const comment = localItem ? localItem.comment : "";

                        // dynamic appreciation
                        let statusText = "Insuffisant";
                        if (val >= 16) statusText = "Très Bien";
                        else if (val >= 14) statusText = "Bien";
                        else if (val >= 12) statusText = "Assez Bien";
                        else if (val >= 10) statusText = "Passable";

                        return (
                          <tr key={g.student_id} className="hover:bg-muted/5 transition-colors">
                            <td className="p-4 font-mono text-xs text-muted-foreground">
                              {g.student?.student_number}
                            </td>
                            <td className="p-4 font-semibold text-foreground">
                              {g.student?.user?.name}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="number"
                                  step="0.25"
                                  min="0"
                                  max={maxValue}
                                  value={localItem ? localItem.value : ""}
                                  onChange={(e) => handleGradeChange(g.student_id, e.target.value)}
                                  className="w-20 font-mono text-center h-8"
                                />
                                <span className="text-xs text-muted-foreground">/{maxValue}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                  val >= 12
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    : val >= 10
                                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                      : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                }`}
                              >
                                {statusText}
                              </span>
                            </td>
                            <td className="p-4">
                              <Input
                                value={comment || ""}
                                onChange={(e) => handleCommentChange(g.student_id, e.target.value)}
                                placeholder="Encouragements, bavardages..."
                                className="w-full h-8 text-xs bg-muted/30"
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

      {(!isEnabled || gradesData.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 border rounded-xl bg-card border-dashed">
          <BookOpen className="size-10 text-muted-foreground stroke-1 mb-3 animate-pulse" />
          <p className="font-semibold text-sm text-foreground">Saisie des Notes académiques</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">
            Sélectionnez une **classe** et une **matière** ci-dessus pour charger la liste des élèves et saisir les notes de l'évaluation sélectionnée.
          </p>
        </div>
      )}
    </div>
  );
}
