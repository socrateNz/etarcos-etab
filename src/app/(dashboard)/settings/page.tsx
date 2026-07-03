"use client";

import { useEffect, useState } from "react";
import { Crown, Settings, School, Edit, Loader2, Sparkles } from "lucide-react";
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
import { listEstablishmentPlans, updateEstablishmentPlan } from "@/app/actions/superadmin";

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
  const [activeTab, setActiveTab] = useState<"subscriptions" | "general">("subscriptions");
  const [schools, setSchools] = useState<SchoolPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSchool, setSelectedSchool] = useState<SchoolPlan | null>(null);
  const [newPlan, setNewPlan] = useState<string>("free");
  const [saving, setSaving] = useState(false);

  const fetchSchools = async () => {
    setLoading(true);
    const res = await listEstablishmentPlans();
    if (res.data) {
      setSchools(res.data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleOpenPlanModal = (school: SchoolPlan) => {
    setSelectedSchool(school);
    setNewPlan(school.plan);
  };

  const handleUpdatePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    setSaving(true);

    const res = await updateEstablishmentPlan(selectedSchool.id, newPlan);
    if (res.success) {
      setSelectedSchool(null);
      fetchSchools();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Abonnements & Paramètres"
          description="Gérez les souscriptions des établissements et configurez les options globales de la plateforme."
          icon={Crown}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-4">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`pb-2.5 font-semibold text-sm flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === "subscriptions"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Crown className="w-4 h-4" /> Formules d'Abonnement
        </button>
        <button
          onClick={() => setActiveTab("general")}
          className={`pb-2.5 font-semibold text-sm flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === "general"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="w-4 h-4" /> Paramètres Système
        </button>
      </div>

      {activeTab === "subscriptions" ? (
        <div className="space-y-6">
          {/* Schools Plan Table */}
          <div className="bg-card rounded-xl border overflow-hidden">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                <p className="text-sm">Chargement des abonnements...</p>
              </div>
            ) : schools.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <School className="w-12 h-12 mx-auto mb-3 opacity-20 text-brand-500" />
                <h3 className="font-semibold text-foreground mb-1">Aucun établissement</h3>
                <p className="text-sm">Aucune école n'est configurée sur la plateforme.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="p-4">Établissement</th>
                      <th className="p-4">Slug</th>
                      <th className="p-4">Formule Active</th>
                      <th className="p-4">Statut Technique</th>
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
      ) : (
        <div className="bg-card rounded-xl border p-6 max-w-2xl space-y-6">
          <h3 className="font-bold text-base border-b pb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-400" /> Configuration de l'application</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app-name">Nom du Portail Saas</Label>
              <Input id="app-name" defaultValue="Etarcos Etab" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-url">URL de redirection principale</Label>
              <Input id="app-url" defaultValue="https://etarcos-etab.com" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-fee">Commission passerelle de paiement (%)</Label>
              <Input id="app-fee" type="number" defaultValue="2.5" className="bg-background" />
            </div>
            <Button className="bg-brand-500 hover:bg-brand-600 text-white font-sans">
              Sauvegarder les configurations
            </Button>
          </div>
        </div>
      )}

      {/* Plan Dialog */}
      <Dialog open={!!selectedSchool} onOpenChange={(open) => !open && setSelectedSchool(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la formule d'abonnement</DialogTitle>
            <DialogDescription>
              Ajustez l'offre commerciale et les fonctionnalités actives de « {selectedSchool?.name} ».
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePlanSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-select">Formule d'offre</Label>
              <select
                id="plan-select"
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="free">Gratuit (Free) — Modules de base uniquement</option>
                <option value="pro">Professionnel (Pro) — + Timetables & Discipline</option>
                <option value="premium">Premium — Accès illimité sans RLS bridé</option>
                <option value="enterprise">Entreprise (Custom) — Support 24/7 & IA active</option>
              </select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setSelectedSchool(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving} className="bg-brand-500 hover:bg-brand-600 text-white">
                {saving ? "Sauvegarde..." : "Appliquer la formule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
