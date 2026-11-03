"use client";

import { useState } from "react";
import { Bot, Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type SynthesisStats = {
  establishments: number;
  students: number;
  staff: number;
  parents: number;
  revenues: number;
  expenses: number;
  paymentRate: number;
  avgGrade: number;
  successRate: number;
  attendanceRate: number | null;
  lateRate: number | null;
  payroll: number;
};

function buildPrompt(s: SynthesisStats): string {
  const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
  const lines = [
    `Établissements concernés : ${s.establishments}`,
    `Élèves : ${s.students}`,
    `Personnel : ${s.staff}`,
    `Parents enregistrés : ${s.parents}`,
    `Encaissements : ${fcfa(s.revenues)}`,
    `Dépenses : ${fcfa(s.expenses)}`,
    `Dépenses de salaires saisies : ${fcfa(s.payroll)}`,
    `Taux de recouvrement des frais : ${s.paymentRate} %`,
    `Moyenne générale des notes : ${s.avgGrade}/20`,
    `Part des notes ≥ 10/20 : ${s.successRate} %`,
    s.attendanceRate != null ? `Taux de présence : ${s.attendanceRate} %` : "Taux de présence : non disponible",
    s.lateRate != null ? `Taux de retard : ${s.lateRate} %` : "Taux de retard : non disponible",
  ];
  return [
    "Rédige une synthèse de gestion (5 à 8 phrases, en français) pour le propriétaire d'un groupe scolaire,",
    "à partir UNIQUEMENT des chiffres ci-dessous. N'invente aucun autre chiffre, nom ou fait.",
    "Si une donnée vaut 0 ou est indisponible, signale qu'elle n'est probablement pas encore saisie plutôt que d'en tirer une conclusion.",
    "Structure : 1) résultats scolaires, 2) finances, 3) deux ou trois recommandations concrètes.",
    "",
    ...lines,
  ].join("\n");
}

export function AiSynthesis({ stats }: { stats: SynthesisStats }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          payload: { messages: [{ role: "user", content: buildPrompt(stats) }] },
        }),
      });
      const data = await res.json().catch(() => null);
      const content: string | undefined = data?.message?.content;
      if (!res.ok || !content) {
        setError(data?.error ?? "La synthèse n'a pas pu être générée.");
      } else if (data?.configured === false) {
        setError(content);
      } else {
        setText(content);
      }
    } catch {
      setError("Erreur de connexion avec le service IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <CardTitle className="text-sm font-bold">Synthèse IA</CardTitle>
          <CardDescription>
            Rédigée par Gemini à partir des chiffres réels affichés dans les autres onglets. Vérifiez-la avant de la diffuser.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {text ? (
          <div className="p-4 border rounded-xl bg-background text-sm leading-relaxed whitespace-pre-line">{text}</div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Cliquez sur « Générer » pour obtenir une synthèse commentée de vos indicateurs.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          {text && (
            <Button
              variant="outline"
              className="gap-2 text-xs"
              onClick={() => {
                void navigator.clipboard.writeText(text);
                toast.success("Synthèse copiée");
              }}
            >
              <Copy className="w-4 h-4" /> Copier
            </Button>
          )}
          <Button onClick={generate} disabled={loading} className="gap-2 text-xs">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {text ? "Régénérer" : "Générer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
