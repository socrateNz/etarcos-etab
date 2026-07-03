"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Package, ShieldAlert, Plus, Search, Hammer, CheckCircle, PenTool, LayoutGrid } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface InventoryItem {
  id: string;
  name: string;
  location: string;
  quantity: number;
  condition: "excellent" | "good" | "damaged" | "needs_maintenance";
  value: number;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: "INV-01", name: "Ordinateurs Dell Optiplex", location: "Salle Informatique A", quantity: 24, condition: "good", value: 7200000 },
  { id: "INV-02", name: "Tables-Bancs en Bois", location: "Bâtiment Principal (Classes)", quantity: 250, condition: "good", value: 3750000 },
  { id: "INV-03", name: "Microscopes Optiques", location: "Laboratoire de Sciences", quantity: 12, condition: "excellent", value: 1800000 },
  { id: "INV-04", name: "Vidéoprojecteurs Epson", location: "Salle Polyvalente", quantity: 4, condition: "needs_maintenance", value: 1200000 },
  { id: "INV-05", name: "Tableaux Blancs Magnétiques", location: "Salles de classe 1-10", quantity: 10, condition: "excellent", value: 500000 },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConditionBadge = (cond: InventoryItem["condition"]) => {
    switch (cond) {
      case "excellent":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Excellent</Badge>;
      case "good":
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Bon état</Badge>;
      case "damaged":
        return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20">Endommagé</Badge>;
      case "needs_maintenance":
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Maintenance requise</Badge>;
    }
  };

  const totalValue = items.reduce((acc, item) => acc + item.value, 0);
  const alertItemsCount = items.filter(item => item.condition === "damaged" || item.condition === "needs_maintenance").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Inventaire & Patrimoine"
          description="Gérez les équipements, le matériel et le patrimoine mobilier de vos établissements scolaires."
          icon={Package}
        />
        <Button className="bg-brand-500 hover:bg-brand-600 text-white font-sans text-xs gap-2 h-9">
          <Plus className="w-4 h-4" /> Enregistrer un actif
        </Button>
      </div>

      {/* Inventory KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Valeur Totale du Parc</CardTitle>
            <Package className="w-4 h-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">14 450 000 FCFA</div>
            <p className="text-[10px] text-muted-foreground mt-1">Actifs physiques comptabilisés</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Maintenance Actives</CardTitle>
            <Hammer className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{alertItemsCount} matériels</div>
            <p className="text-[10px] text-muted-foreground mt-1">À réviser ou réparer</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Salles Équipées</CardTitle>
            <LayoutGrid className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">14 salles</div>
            <p className="text-[10px] text-muted-foreground mt-1">Salles de classe, labos, bureaux</p>
          </CardContent>
        </Card>
      </div>

      {/* Search inventory */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par nom de matériel, localisation..."
          className="pl-9 bg-card border-border"
        />
      </div>

      {/* Inventory table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-white">Registre des Actifs</CardTitle>
          <CardDescription>Liste du mobilier et des équipements enregistrés par salle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground">
              <thead className="text-xs text-white uppercase bg-muted/20">
                <tr>
                  <th className="px-4 py-3 font-semibold">Identifiant</th>
                  <th className="px-4 py-3 font-semibold">Actif / Équipement</th>
                  <th className="px-4 py-3 font-semibold">Localisation</th>
                  <th className="px-4 py-3 font-semibold text-center">Quantité</th>
                  <th className="px-4 py-3 font-semibold text-center">État d'usage</th>
                  <th className="px-4 py-3 font-semibold text-right">Valeur Estimée</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-brand-500">{item.id}</td>
                    <td className="px-4 py-3 font-semibold text-white">{item.name}</td>
                    <td className="px-4 py-3">{item.location}</td>
                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-center">{getConditionBadge(item.condition)}</td>
                    <td className="px-4 py-3 text-right font-bold text-white">{(item.value).toLocaleString()} FCFA</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" className="text-xs hover:bg-brand-500/10 hover:text-white">
                        Modifier
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
