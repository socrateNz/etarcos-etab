"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { FileText, Download, Printer, Plus, Search, FileCode, CheckCircle, FolderOpen, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface DocTemplate {
  id: string;
  name: string;
  category: "admin" | "academic" | "financial" | "hr";
  format: "PDF" | "DOCX" | "XLSX";
  description: string;
}

const TEMPLATES: DocTemplate[] = [
  { id: "DOC-01", name: "Fiche d'Inscription Élève", category: "admin", format: "PDF", description: "Fiche officielle de collecte des renseignements élève et parents lors de l'admission." },
  { id: "DOC-02", name: "Certificat de Scolarité", category: "admin", format: "DOCX", description: "Modèle de certificat de scolarité personnalisable avec le logo de l'établissement." },
  { id: "DOC-03", name: "Règlement Intérieur de l'École", category: "admin", format: "PDF", description: "Charte de vie scolaire et règles de discipline à faire signer par les parents." },
  { id: "DOC-04", name: "Cahier de Textes Trimestriel", category: "academic", format: "DOCX", description: "Grille de suivi des cours dispensés par matière et par classe." },
  { id: "DOC-05", name: "Fiche de Présence Journalière", category: "academic", format: "PDF", description: "Fiche d'appel manuelle pour les enseignants en cas de panne réseau." },
  { id: "DOC-06", name: "Grille d'Évaluation des Enseignants", category: "hr", format: "DOCX", description: "Formulaire d'évaluation des compétences pédagogiques et professionnelles." },
  { id: "DOC-07", name: "Modèle de Fiche de Paie", category: "financial", format: "XLSX", description: "Calculateur de salaire net avec retenues et primes pour le personnel." },
];

export default function DocumentsPage() {
  const [templates, setTemplates] = useState<DocTemplate[]>(TEMPLATES);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryBadge = (cat: DocTemplate["category"]) => {
    switch (cat) {
      case "admin":
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Administratif</Badge>;
      case "academic":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Académique</Badge>;
      case "financial":
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Finance</Badge>;
      case "hr":
        return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">RH & Personnel</Badge>;
    }
  };

  const getFormatBadge = (fmt: DocTemplate["format"]) => {
    switch (fmt) {
      case "PDF":
        return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold">{fmt}</Badge>;
      case "DOCX":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold">{fmt}</Badge>;
      case "XLSX":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold">{fmt}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Documents & Modèles Administratifs"
          description="Téléchargez des fiches d'inscription, règlements de vie scolaire, contrats types et fichiers de paie."
          icon={FileText}
        />
        <Button className="bg-brand-500 hover:bg-brand-600 text-white font-sans text-xs gap-2 h-9">
          <Plus className="w-4 h-4" /> Uploader un modèle
        </Button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Modèles Officiels</CardTitle>
            <FolderOpen className="w-4 h-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">42 fichiers</div>
            <p className="text-[10px] text-muted-foreground mt-1">Prêts à imprimer ou à compléter</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Téléchargements</CardTitle>
            <Download className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">180 clics</div>
            <p className="text-[10px] text-muted-foreground mt-1">Effectués ce trimestre par les écoles</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Certificats Générés</CardTitle>
            <FileCode className="w-4 h-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">125 fiches</div>
            <p className="text-[10px] text-muted-foreground mt-1">Documents d'élèves générés en ligne</p>
          </CardContent>
        </Card>
      </div>

      {/* Search documents */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par nom de document, description..."
          className="pl-9 bg-card border-border"
        />
      </div>

      {/* Documents table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-white">Bibliothèque de Modèles</CardTitle>
          <CardDescription>Téléchargez les canevas et fiches officiels d'administration scolaire</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground">
              <thead className="text-xs text-white uppercase bg-muted/20">
                <tr>
                  <th className="px-4 py-3 font-semibold">Identifiant</th>
                  <th className="px-4 py-3 font-semibold">Document</th>
                  <th className="px-4 py-3 font-semibold">Catégorie</th>
                  <th className="px-4 py-3 font-semibold text-center">Format</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filteredTemplates.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-brand-500">{t.id}</td>
                    <td className="px-4 py-3 font-semibold text-white">{t.name}</td>
                    <td className="px-4 py-3 text-xs">{getCategoryBadge(t.category)}</td>
                    <td className="px-4 py-3 text-center">{getFormatBadge(t.format)}</td>
                    <td className="px-4 py-3 italic max-w-xs truncate">{t.description}</td>
                    <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                      <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 hover:bg-brand-500/10 hover:text-white">
                        <Download className="w-3.5 h-3.5" /> Télécharger
                      </Button>
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
