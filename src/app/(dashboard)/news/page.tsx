"use client";

import { useState } from "react";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: "update" | "maintenance" | "general";
  date: string;
}

const INITIAL_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Mise à jour v1.4.0 — Saisie des Relevés de Notes facilitée",
    content: "Nous avons optimisé le module de saisie des relevés de notes. Les enseignants peuvent désormais saisir directement les barèmes personnalisés et le système calcule instantanément les moyennes de classe de manière asynchrone.",
    category: "update",
    date: "01 Juillet 2026",
  },
  {
    id: "2",
    title: "Planification de maintenance des bases de données",
    content: "Une maintenance préventive de l'infrastructure Supabase est planifiée le samedi 5 juillet de 23h à 01h. Pendant ce créneau, l'accès au portail sera momentanément interrompu.",
    category: "maintenance",
    date: "28 Juin 2026",
  },
];

const categoryColors: Record<string, string> = {
  update: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  maintenance: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  general: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const categoryLabels: Record<string, string> = {
  update: "Mise à jour",
  maintenance: "Maintenance",
  general: "Général",
};

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"update" | "maintenance" | "general">("general");

  // Confirmation dialog states
  const [newsToDelete, setNewsToDelete] = useState<NewsItem | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const newItem: NewsItem = {
      id: String(Date.now()),
      title,
      content,
      category,
      date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    };

    setNews([newItem, ...news]);
    setIsAddOpen(false);
    setTitle("");
    setContent("");
    setCategory("general");
  };

  const onConfirmDeleteNews = () => {
    if (!newsToDelete) return;
    setNews((prev) => prev.filter((item) => item.id !== newsToDelete.id));
    setNewsToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Actualités & Flash Infos"
          description="Publiez des annonces générales, notes de version ou plannings de maintenance à l'attention des établissements."
          icon={Megaphone}
        />
        <Button onClick={() => setIsAddOpen(true)} className="sm:self-end gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="w-4 h-4" /> Publier une actualité
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {news.map((item) => (
          <Card key={item.id} className="bg-card hover:shadow-md transition-shadow relative group">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start gap-4">
                <Badge className={`border uppercase text-[10px] font-bold ${categoryColors[item.category] || ""}`}>
                  {categoryLabels[item.category] || item.category}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{item.date}</span>
              </div>
              <CardTitle className="text-base font-bold text-foreground mt-2">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{item.content}</p>
              <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={() => setNewsToDelete(item)}
                  size="icon-xs"
                  variant="ghost"
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publier une annonce</DialogTitle>
            <DialogDescription>
              Le flash info sera visible sur le tableau de bord de tous les directeurs.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="news-title">Titre de l'annonce *</Label>
              <Input id="news-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: Version 1.4 active" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="news-cat">Catégorie</Label>
              <select
                id="news-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="general">Général (Vert)</option>
                <option value="update">Mise à jour logicielle (Bleu)</option>
                <option value="maintenance">Maintenance préventive (Rouge)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="news-content">Contenu de l'annonce *</Label>
              <Textarea
                id="news-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Rédigez le texte de l'annonce..."
                className="h-24"
                required
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white">
                Diffuser l'annonce
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!newsToDelete}
        onOpenChange={(open) => !open && setNewsToDelete(null)}
        title="Supprimer l'actualité"
        description={`Voulez-vous vraiment supprimer l'actualité "${newsToDelete?.title}" ?`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={onConfirmDeleteNews}
        variant="destructive"
      />
    </div>
  );
}
