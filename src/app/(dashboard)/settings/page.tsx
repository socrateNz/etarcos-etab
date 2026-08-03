"use client";

import { useEffect, useState } from "react";
import {
  Crown,
  Settings,
  School,
  Edit,
  Loader2,
  Sparkles,
  Calendar,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { listEstablishmentPlans, updateEstablishmentPlan } from "@/app/actions/superadmin";
import {
  listAcademicYearsAction,
  createAcademicYearAction,
  setCurrentAcademicYearAction,
  autoCreateDefaultAcademicYearAction,
  type AcademicYearItem,
} from "@/app/actions/academic-years";
import { useAuth } from "@/hooks/use-auth";

interface SchoolPlan {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: "free" | "pro" | "premium" | "enterprise";
  logo_url: string | null;
  created_at: string;
}

const planColors: Record<string, string> = {
  free: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  pro: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  premium: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  enterprise: "bg-red-500/10 text-red-500 border-red-500/20",
};

const planLabels: Record<string, string> = {
  free: "Gratuit (Free)",
  pro: "Professionnel (Pro)",
  premium: "Premium",
  enterprise: "Entreprise (Custom)",
};

export default function SettingsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [activeTab, setActiveTab] = useState<"academic_years" | "subscriptions" | "general">(
    "academic_years"
  );

  // Subscriptions state
  const [schools, setSchools] = useState<SchoolPlan[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolPlan | null>(null);
  const [newPlan, setNewPlan] = useState<string>("free");
  const [savingPlan, setSavingPlan] = useState(false);

  // Academic Years state
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [yearName, setYearName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);
  const [savingYear, setSavingYear] = useState(false);

  const fetchAcademicYears = async () => {
    setLoadingYears(true);
    const res = await listAcademicYearsAction();
    if (res.data) {
      setAcademicYears(res.data);
    }
    setLoadingYears(false);
  };

  const fetchSchools = async () => {
    if (!isSuperAdmin) return;
    setLoadingSchools(true);
    const res = await listEstablishmentPlans();
    if (res.data) {
      setSchools(res.data as any);
    }
    setLoadingSchools(false);
  };

  useEffect(() => {
    fetchAcademicYears();
    if (isSuperAdmin) {
      fetchSchools();
    }
  }, [isSuperAdmin]);

  const handleOpenYearModal = () => {
    const currentYr = new Date().getFullYear();
    const nextYr = currentYr + 1;
    setYearName(`${currentYr}-${nextYr}`);
    setStartDate(`${currentYr}-09-01`);
    setEndDate(`${nextYr}-06-30`);
    setIsCurrent(true);
    setYearDialogOpen(true);
  };

  const handleCreateYearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearName || !startDate || !endDate) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setSavingYear(true);
    const res = await createAcademicYearAction({
      name: yearName,
      start_date: startDate,
      end_date: endDate,
      is_current: isCurrent,
    });

    if (res.error) {
      toast.error("Erreur de création", { description: res.error });
    } else {
      toast.success(`Année académique ${yearName} enregistrée !`);
      setYearDialogOpen(false);
      fetchAcademicYears();
    }
    setSavingYear(false);
  };

  const handleSetCurrentYear = async (id: string) => {
    const res = await setCurrentAcademicYearAction(id);
    if (res.error) {
      toast.error("Erreur", { description: res.error });
    } else {
      toast.success("Année académique courante mise à jour.");
      fetchAcademicYears();
    }
  };

  const handleAutoCreateDefaultYear = async () => {
    setLoadingYears(true);
    const res = await autoCreateDefaultAcademicYearAction();
    if (res.error) {
      toast.error("Erreur", { description: res.error });
    } else {
      toast.success("Année académique courante créée avec succès !");
      fetchAcademicYears();
    }
    setLoadingYears(false);
  };

  const handleOpenPlanModal = (school: SchoolPlan) => {
    setSelectedSchool(school);
    setNewPlan(school.plan);
  };

  const handleUpdatePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    setSavingPlan(true);

    const res = await updateEstablishmentPlan(selectedSchool.id, newPlan);
    if (res.success) {
      setSelectedSchool(null);
      fetchSchools();
    }
    setSavingPlan(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Paramètres de l'Établissement"
          description="Configurez les années académiques, le calendrier de scolarité et les options de votre établissement."
          icon={Settings}
        />
        {activeTab === "academic_years" && (
          <Button
            onClick={handleOpenYearModal}
            className="gap-2 bg-brand-500 hover:bg-brand-600 text-slate-950 dark:text-white font-semibold self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Nouvelle Année Académique
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-4">
        <button
          onClick={() => setActiveTab("academic_years")}
          className={`pb-2.5 font-semibold text-sm flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === "academic_years"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="w-4 h-4" /> Années Académiques
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`pb-2.5 font-semibold text-sm flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === "subscriptions"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Crown className="w-4 h-4" /> Abonnements SaaS
          </button>
        )}
        <button
          onClick={() => setActiveTab("general")}
          className={`pb-2.5 font-semibold text-sm flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === "general"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="w-4 h-4" /> Options Générales
        </button>
      </div>

      {/* TAB 1: ACADEMIC YEARS */}
      {activeTab === "academic_years" && (
        <div className="space-y-6">
          {academicYears.length === 0 && !loadingYears && (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Aucune année académique configurée</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Votre établissement nécessite au moins une année académique active pour enregistrer des classes et élèves.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleAutoCreateDefaultYear}
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shrink-0"
              >
                <Sparkles className="w-4 h-4" /> Créer 2025-2026 automatiquement
              </Button>
            </div>
          )}

          <div className="bg-card rounded-xl border overflow-hidden">
            {loadingYears ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                <p className="text-sm">Chargement des années académiques...</p>
              </div>
            ) : academicYears.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20 text-brand-500" />
                <h3 className="font-semibold text-foreground mb-1">Aucune année enregistrée</h3>
                <p className="text-xs max-w-sm mx-auto mb-4">
                  Cliquez sur "Nouvelle Année Académique" ci-dessus pour définir votre calendrier de scolarité.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="p-4">Année Académique</th>
                      <th className="p-4">Date de début</th>
                      <th className="p-4">Date de fin</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {academicYears.map((ay) => (
                      <tr key={ay.id} className="hover:bg-muted/5 transition-colors">
                        <td className="p-4 font-bold text-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-brand-500" />
                          {ay.name}
                        </td>
                        <td className="p-4 text-muted-foreground">{ay.start_date}</td>
                        <td className="p-4 text-muted-foreground">{ay.end_date}</td>
                        <td className="p-4">
                          {ay.is_current ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 gap-1 text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Actuelle (En cours)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {!ay.is_current && (
                            <Button
                              onClick={() => handleSetCurrentYear(ay.id)}
                              size="xs"
                              variant="outline"
                              className="text-xs"
                            >
                              Définir comme active
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTIONS (SUPER ADMIN ONLY) */}
      {activeTab === "subscriptions" && isSuperAdmin && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl border overflow-hidden">
            {loadingSchools ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                <p className="text-sm">Chargement des abonnements...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="p-4">Établissement</th>
                      <th className="p-4">Slug</th>
                      <th className="p-4">Formule Active</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {schools.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/5 transition-colors">
                        <td className="p-4 font-semibold text-foreground">{s.name}</td>
                        <td className="p-4 font-mono text-xs text-muted-foreground">/{s.slug}</td>
                        <td className="p-4">
                          <Badge className={`border uppercase text-[11px] font-bold ${planColors[s.plan] || ""}`}>
                            {planLabels[s.plan] || s.plan}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={s.status === "active" ? "default" : "secondary"}>
                            {s.status === "active" ? "Actif" : "Bloqué"}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            onClick={() => handleOpenPlanModal(s)}
                            size="icon-xs"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-brand-500"
                            title="Modifier Formule"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GENERAL SETTINGS */}
      {activeTab === "general" && (
        <div className="bg-card rounded-xl border p-6 max-w-2xl space-y-6">
          <h3 className="font-bold text-base border-b pb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" /> Options de l'établissement
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app-name">Nom de la Plateforme</Label>
              <Input id="app-name" defaultValue="Etarcos Etab" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-url">Devise d'affichage</Label>
              <Input id="app-url" defaultValue="FCFA (XAF)" className="bg-background" />
            </div>
            <Button className="bg-brand-500 hover:bg-brand-600 text-slate-950 dark:text-white font-semibold">
              Sauvegarder les configurations
            </Button>
          </div>
        </div>
      )}

      {/* Modal: New Academic Year */}
      <Dialog open={yearDialogOpen} onOpenChange={setYearDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle Année Académique</DialogTitle>
            <DialogDescription>
              Définissez la nouvelle période scolaire de votre établissement (ex: 2025-2026).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateYearSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="year-name">Intitulé de l'année *</Label>
              <Input
                id="year-name"
                value={yearName}
                onChange={(e) => setYearName(e.target.value)}
                placeholder="ex: 2025-2026"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year-start">Date de rentrée *</Label>
                <Input
                  id="year-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year-end">Date de clôture *</Label>
                <Input
                  id="year-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="year-current"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
                className="w-4 h-4 rounded border-input text-brand-500 focus:ring-brand-500 cursor-pointer"
              />
              <Label htmlFor="year-current" className="cursor-pointer font-medium text-sm">
                Définir comme année académique courante (Active)
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setYearDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={savingYear}>
                {savingYear && <Loader2 className="mr-2 size-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
