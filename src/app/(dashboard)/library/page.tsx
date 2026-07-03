"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Library, BookOpen, Clock, AlertCircle, Plus, Search, BookMarked, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  copies: number;
  available: number;
  category: string;
}

const MOCK_BOOKS: Book[] = [
  { id: "BK-01", title: "Le Vieux Nègre et la Médaille", author: "Ferdinand Oyono", isbn: "978-2708700598", copies: 15, available: 12, category: "Littérature Africaine" },
  { id: "BK-02", title: "L'Enfant Noir", author: "Camara Laye", isbn: "978-2266161749", copies: 25, available: 18, category: "Littérature Africaine" },
  { id: "BK-03", title: "Une vie de boy", author: "Ferdinand Oyono", isbn: "978-2266112345", copies: 20, available: 14, category: "Littérature Africaine" },
  { id: "BK-04", title: "Algèbre et Géométrie - Terminale C", author: "CIAM", isbn: "978-2841295678", copies: 40, available: 35, category: "Scolaire (Maths)" },
  { id: "BK-05", title: "Physique Chimie - 1ère D", author: "Hachette", isbn: "978-2011354567", copies: 30, available: 22, category: "Scolaire (Physique)" },
  { id: "BK-06", title: "Le Cid", author: "Pierre Corneille", isbn: "978-2035844453", copies: 10, available: 6, category: "Littérature Classique" },
];

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Bibliothèque Scolaire"
          description="Gérez le catalogue des manuels scolaires et livres littéraires, suivez les emprunts et les retours."
          icon={Library}
        />
        <Button className="bg-brand-500 hover:bg-brand-600 text-white font-sans text-xs gap-2 h-9">
          <Plus className="w-4 h-4" /> Ajouter un ouvrage
        </Button>
      </div>

      {/* Library KPI metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Ouvrages Enregistrés</CardTitle>
            <BookMarked className="w-4 h-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">2 450 volumes</div>
            <p className="text-[10px] text-muted-foreground mt-1">142 titres uniques catalogués</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Emprunts Actifs</CardTitle>
            <BookOpen className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">34 livres</div>
            <p className="text-[10px] text-muted-foreground mt-1">Prêtés aux élèves & professeurs</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Retards Critiques</CardTitle>
            <Clock className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">7 retards</div>
            <p className="text-[10px] text-muted-foreground mt-1">Alertes de retour non validées</p>
          </CardContent>
        </Card>
      </div>

      {/* Search catalogue */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par titre, auteur, genre..."
          className="pl-9 bg-card border-border"
        />
      </div>

      {/* Book table catalogue */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-white">Catalogue d'Ouvrages</CardTitle>
          <CardDescription>Liste complète des manuels disponibles pour emprunt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground">
              <thead className="text-xs text-white uppercase bg-muted/20">
                <tr>
                  <th className="px-4 py-3 font-semibold">Titre</th>
                  <th className="px-4 py-3 font-semibold">Auteur</th>
                  <th className="px-4 py-3 font-semibold">Catégorie</th>
                  <th className="px-4 py-3 font-semibold text-center">Exemplaires</th>
                  <th className="px-4 py-3 font-semibold text-center">Disponibles</th>
                  <th className="px-4 py-3 font-semibold text-center">Statut</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filteredBooks.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">{b.title}</td>
                    <td className="px-4 py-3">{b.author}</td>
                    <td className="px-4 py-3 text-xs">
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-0">{b.category}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">{b.copies}</td>
                    <td className="px-4 py-3 text-center font-bold">{b.available}</td>
                    <td className="px-4 py-3 text-center">
                      {b.available > 0 ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">En Stock</Badge>
                      ) : (
                        <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20">Épuisé</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" className="text-xs hover:bg-brand-500/10 hover:text-white">
                        Prêter
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
