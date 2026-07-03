"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Award, Plus, Search, ExternalLink, Printer, CheckCircle, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface GraduateStudent {
  id: string;
  name: string;
  class: string;
  diplomaName: string;
  score: number;
  status: "generated" | "pending";
}

const MOCK_GRADUATES: GraduateStudent[] = [
  { id: "GRAD-01", name: "Sarah Kamdem", class: "Terminale C", diplomaName: "Baccalauréat Scientifique (S)", score: 15.2, status: "generated" },
  { id: "GRAD-02", name: "Jean-Pierre Tagne", class: "3ème A", diplomaName: "BEPC", score: 14.5, status: "generated" },
  { id: "GRAD-03", name: "Marie-Louise Ngono", class: "Terminale A", diplomaName: "Baccalauréat Littéraire (A)", score: 12.8, status: "pending" },
  { id: "GRAD-04", name: "Alain Nguema", class: "3ème B", diplomaName: "BEPC", score: 11.2, status: "pending" },
];

export default function DiplomasPage() {
  const [graduates, setGraduates] = useState<GraduateStudent[]>(MOCK_GRADUATES);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGraduates = graduates.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.diplomaName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Génération de Diplômes & Certificats"
          description="Créez, signez et imprimez les relevés d'examen officiels, certificats de réussite et diplômes d'honneur."
          icon={Award}
        />
        <Button className="bg-brand-500 hover:bg-brand-600 text-white font-sans text-xs gap-2 h-9">
          <Plus className="w-4 h-4" /> Nouveau modèle de diplôme
        </Button>
      </div>

      {/* Diplomas Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Modèles de Diplômes</CardTitle>
            <Award className="w-4 h-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">4 modèles</div>
            <p className="text-[10px] text-muted-foreground mt-1">BEPC, Bac, Certificats de mérite</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Diplômes Générés</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">142 générés</div>
            <p className="text-[10px] text-muted-foreground mt-1">Générés et archivés en PDF sécurisé</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Demandes en attente</CardTitle>
            <HelpCircle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">12 élèves</div>
            <p className="text-[10px] text-muted-foreground mt-1">Attente de validation des notes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search grads */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un élève diplômé..."
          className="pl-9 bg-card border-border"
        />
      </div>

      {/* Graduates table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-white">Élèves Admissibles & Diplômes</CardTitle>
          <CardDescription>Générez les parchemins officiels pour les élèves en fin de cycle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground">
              <thead className="text-xs text-white uppercase bg-muted/20">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nom de l'élève</th>
                  <th className="px-4 py-3 font-semibold">Classe</th>
                  <th className="px-4 py-3 font-semibold">Diplôme Préparé</th>
                  <th className="px-4 py-3 font-semibold text-center">Moyenne Examen</th>
                  <th className="px-4 py-3 font-semibold text-center">Statut Doc</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filteredGraduates.map((g) => (
                  <tr key={g.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">{g.name}</td>
                    <td className="px-4 py-3">{g.class}</td>
                    <td className="px-4 py-3 font-medium text-slate-300">{g.diplomaName}</td>
                    <td className="px-4 py-3 text-center font-bold">{g.score} /20</td>
                    <td className="px-4 py-3 text-center">
                      {g.status === "generated" ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Généré & Signé</Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">À Éditer</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                      {g.status === "generated" ? (
                        <Button variant="outline" size="sm" className="text-xs h-8 gap-1 hover:bg-brand-500/10 hover:text-white">
                          <Printer className="w-3.5 h-3.5" /> Imprimer
                        </Button>
                      ) : (
                        <Button size="sm" className="text-xs h-8 bg-brand-500 hover:bg-brand-600 text-white">
                          Générer le Diplôme
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
