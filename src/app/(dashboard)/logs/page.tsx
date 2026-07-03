"use client";

import { useEffect, useState } from "react";
import { FileText, Search, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listAuditLogsAction } from "@/app/actions/superadmin";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  ip_address: string | null;
  created_at: string;
  user?: {
    name: string;
  } | null;
  establishment?: {
    name: string;
  } | null;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    const res = await listAuditLogsAction();
    if (res.data) {
      setLogs(res.data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.entity.toLowerCase().includes(search.toLowerCase()) ||
    (l.user?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journaux d'Audit & Sécurité"
        description="Consultez l'historique des actions effectuées sur la base de données par l'ensemble des administrateurs."
        icon={FileText}
      />

      {/* Search toolbar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Filtrer par action, entité ou utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <p className="text-sm">Chargement des journaux de sécurité...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20 text-brand-500" />
            <h3 className="font-semibold text-foreground mb-1">Aucun journal d'audit</h3>
            <p className="text-sm">Les événements de sécurité s'afficheront ici lorsqu'ils surviendront.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">Établissement</th>
                  <th className="p-4">Action effectuée</th>
                  <th className="p-4">Entité modifiée</th>
                  <th className="p-4">IP Adresse</th>
                  <th className="p-4">Date de transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm font-mono">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/5 transition-colors">
                    <td className="p-4 font-sans font-semibold text-foreground">
                      {l.user?.name || <span className="text-red-500">Système (Auto)</span>}
                    </td>
                    <td className="p-4 font-sans text-muted-foreground text-xs">
                      {l.establishment?.name || "Global / Saas"}
                    </td>
                    <td className="p-4 text-xs font-bold text-brand-500 uppercase tracking-tight">
                      {l.action}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {l.entity}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground font-mono">
                      {l.ip_address || "127.0.0.1"}
                    </td>
                    <td className="p-4 font-sans text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
