"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/page-header";
import { CreditCard, TrendingUp, TrendingDown, DollarSign, Loader2, ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getAccountingPageData } from "@/app/actions/owner";
import { useOwnerStore } from "@/store/owner-store";
import Link from "next/link";

export default function AccountingPage() {
  const { mode, selectedEstablishmentId } = useOwnerStore();

  const { data, isLoading } = useQuery({
    queryKey: ["accounting-page-data", mode, selectedEstablishmentId],
    queryFn: () => getAccountingPageData(),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted/40 rounded w-1/4" />
        <div className="h-4 bg-muted/30 rounded w-1/3 mt-2" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-muted/20 rounded-xl border border-border/10" />
          ))}
        </div>
        <div className="h-80 bg-muted/20 rounded-xl border border-border/10 mt-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Tableau financier"
          description="Consultez les recettes scolaires, les dépenses d'exploitation et l'état général de votre trésorerie."
          icon={CreditCard}
        />
        <div className="flex gap-2">
          <Link
            href="/expenses"
            className="inline-flex items-center justify-center rounded-lg text-xs font-medium border border-border bg-transparent shadow-sm hover:bg-muted transition-colors h-9 px-3 gap-1"
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Gérer les dépenses
          </Link>
          <Link
            href="/payments"
            className="inline-flex items-center justify-center rounded-lg text-xs font-medium bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition-colors h-9 px-3 gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Enregistrer un paiement
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Recettes (Entrées)</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(data.totalIncomes, "XAF")}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Total des encaissements enregistrés</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Dépenses (Sorties)</CardTitle>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">{formatCurrency(data.totalExpenses, "XAF")}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Total des frais de fonctionnement payés</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Solde Net (Trésorerie)</CardTitle>
            <DollarSign className="w-4 h-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold mt-0.5", data.balance >= 0 ? "text-cyan-400" : "text-rose-400")}>
              {formatCurrency(data.balance, "XAF")}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Excédent net consolidé</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions list card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-white">Flux de Transactions Récents</CardTitle>
          <CardDescription>Historique chronologique combiné des encaissements et décaissements</CardDescription>
        </CardHeader>
        <CardContent>
          {data.transactions.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">Aucune transaction enregistrée.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-muted-foreground">
                <thead className="text-xs text-white uppercase bg-muted/20">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold text-center">Type</th>
                    <th className="px-4 py-3 font-semibold">Catégorie</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right font-semibold">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {data.transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono">{formatDate(tx.date)}</td>
                      <td className="px-4 py-3 text-center">
                        {tx.type === "income" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] py-0.5">Recette</Badge>
                        ) : (
                          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px] py-0.5">Dépense</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{tx.category}</td>
                      <td className="px-4 py-3 italic">{tx.description}</td>
                      <td className={cn("px-4 py-3 text-right font-bold", tx.type === "income" ? "text-emerald-400" : "text-rose-400")}>
                        {tx.type === "income" ? "+" : "-"} {formatCurrency(tx.amount, "XAF")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
