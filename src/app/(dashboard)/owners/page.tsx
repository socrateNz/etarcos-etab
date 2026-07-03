"use client";

import { useEffect, useState } from "react";
import { Building, Plus, Search, Trash2, Mail, Phone, Loader2, CheckCircle2, AlertCircle, Link, School } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  listOwnersAction,
  createOwnerAction,
  deleteOwnerAction,
  listOwnerLinksAction,
  associateOwnerAction,
  dissociateOwnerAction,
  listEstablishmentPlans,
} from "@/app/actions/superadmin";

interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
}

interface OwnerLink {
  establishment_id: string;
  owner_id: string;
  role: "primary" | "co-owner" | "investor";
  establishment?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface SchoolItem {
  id: string;
  name: string;
  slug: string;
}

const roleLabels: Record<string, string> = {
  primary: "Propriétaire Principal",
  "co-owner": "Copropriétaire",
  investor: "Investisseur",
};

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Links dialog states
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [isLinksOpen, setIsLinksOpen] = useState(false);
  const [links, setLinks] = useState<OwnerLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  const [allSchools, setAllSchools] = useState<SchoolItem[]>([]);
  const [assocSchoolId, setAssocSchoolId] = useState("");
  const [assocRole, setAssocRole] = useState<string>("primary");
  const [linking, setLinking] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ConfirmDialog states
  const [ownerToDelete, setOwnerToDelete] = useState<Owner | null>(null);
  const [schoolToDissociate, setSchoolToDissociate] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchOwners = async () => {
    setLoading(true);
    const res = await listOwnersAction();
    if (res.data) {
      setOwners(res.data as Owner[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setSaving(true);
    setFeedback(null);

    const res = await createOwnerAction({ name, email, phone });
    if (res.success) {
      const pwd = (res.data as any)?.password;
      setTempPassword(pwd || null);
      setName("");
      setEmail("");
      setPhone("");
      setIsAddOpen(false);
      fetchOwners();
    } else {
      setFeedback({ type: "error", message: res.error || "Une erreur est survenue." });
    }
    setSaving(false);
  };

  const onConfirmDeleteOwner = async () => {
    if (!ownerToDelete) return;
    setDeleting(true);
    const res = await deleteOwnerAction(ownerToDelete.id);
    if (res.success) {
      setOwnerToDelete(null);
      fetchOwners();
    }
    setDeleting(false);
  };

  const handleOpenLinks = async (owner: Owner) => {
    setSelectedOwner(owner);
    setIsLinksOpen(true);
    setLoadingLinks(true);

    // Fetch existing connections
    const linksRes = await listOwnerLinksAction(owner.id);
    if (linksRes.data) {
      setLinks(linksRes.data as any[]);
    }

    // Fetch schools list if not loaded yet
    if (allSchools.length === 0) {
      const schoolsRes = await listEstablishmentPlans();
      if (schoolsRes.data) {
        setAllSchools(schoolsRes.data as any[]);
      }
    }
    setLoadingLinks(false);
  };

  const handleAssociate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwner || !assocSchoolId) return;
    setLinking(true);

    const res = await associateOwnerAction(selectedOwner.id, assocSchoolId, assocRole);
    if (res.success) {
      // Reload links
      const linksRes = await listOwnerLinksAction(selectedOwner.id);
      if (linksRes.data) {
        setLinks(linksRes.data as any[]);
      }
      setAssocSchoolId("");
    }
    setLinking(false);
  };

  const onConfirmDissociate = async () => {
    if (!selectedOwner || !schoolToDissociate) return;
    setLinking(true);

    const res = await dissociateOwnerAction(selectedOwner.id, schoolToDissociate);
    if (res.success) {
      setSchoolToDissociate(null);
      // Reload links
      const linksRes = await listOwnerLinksAction(selectedOwner.id);
      if (linksRes.data) {
        setLinks(linksRes.data as any[]);
      }
    }
    setLinking(false);
  };

  const filteredOwners = owners.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Propriétaires d'Établissements"
          description="Gérez les comptes des promoteurs et propriétaires d'écoles inscrits sur la plateforme."
          icon={Building}
        />
        <Button onClick={() => setIsAddOpen(true)} className="sm:self-end gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="w-4 h-4" /> Nouveau propriétaire
        </Button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          feedback.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
            : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{feedback.message}</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      {/* List Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <p className="text-sm">Chargement des propriétaires...</p>
          </div>
        ) : filteredOwners.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-3 opacity-20 text-brand-500" />
            <h3 className="font-semibold text-foreground mb-1">Aucun propriétaire</h3>
            <p className="text-sm">Enregistrez un promoteur pour lui associer un établissement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Nom complet</th>
                  <th className="p-4">Adresse e-mail</th>
                  <th className="p-4">Téléphone</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredOwners.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/5 transition-colors">
                    <td className="p-4 font-semibold text-foreground">{o.name}</td>
                    <td className="p-4 text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {o.email}</span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {o.phone || "—"}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant={o.status === "active" ? "default" : "secondary"}>
                        {o.status === "active" ? "Actif" : "Archivé"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex gap-1.5">
                        <Button
                          onClick={() => handleOpenLinks(o)}
                          size="icon-xs"
                          variant="ghost"
                          title="Gérer les Écoles"
                          className="text-brand-500 hover:text-brand-600 hover:bg-brand-500/10"
                        >
                          <Link className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          onClick={() => setOwnerToDelete(o)}
                          size="icon-xs"
                          variant="ghost"
                          title="Supprimer"
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer un propriétaire</DialogTitle>
            <DialogDescription>
              Créez une fiche de promoteur pour la facturation et le suivi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="own-name">Nom complet *</Label>
              <Input id="own-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Jean Dupont" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="own-email">Adresse e-mail *</Label>
              <Input id="own-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ex: dupont@mail.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="own-phone">Téléphone</Label>
              <Input id="own-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="ex: +237 600 000 000" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving} className="bg-brand-500 hover:bg-brand-600 text-white">
                {saving ? "Création..." : "Créer le promoteur"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Linked Establishments Dialog */}
      <Dialog open={isLinksOpen} onOpenChange={setIsLinksOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Établissements de {selectedOwner?.name}</DialogTitle>
            <DialogDescription>
              Associez ce promoteur à un ou plusieurs établissements scolaires.
            </DialogDescription>
          </DialogHeader>

          {loadingLinks ? (
            <div className="p-8 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
              <span className="text-sm text-muted-foreground">Chargement des liens...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Add association form */}
              <form onSubmit={handleAssociate} className="p-3 border rounded-xl bg-muted/10 space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase">Nouvelle association</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="assoc-school" className="text-xs">Sélectionner l'école</Label>
                    <select
                      id="assoc-school"
                      value={assocSchoolId}
                      onChange={(e) => setAssocSchoolId(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      required
                    >
                      <option value="">Sélectionner...</option>
                      {allSchools
                        .filter((sch) => !links.some((l) => l.establishment_id === sch.id))
                        .map((sch) => (
                          <option key={sch.id} value={sch.id}>
                            {sch.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="assoc-role" className="text-xs">Type de rôle</Label>
                    <select
                      id="assoc-role"
                      value={assocRole}
                      onChange={(e) => setAssocRole(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="primary">Propriétaire Principal</option>
                      <option value="co-owner">Copropriétaire</option>
                      <option value="investor">Investisseur</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <Button type="submit" size="sm" disabled={linking || !assocSchoolId} className="h-7 text-xs bg-brand-500 hover:bg-brand-600 text-white gap-1">
                    {linking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    Associer l'établissement
                  </Button>
                </div>
              </form>

              {/* Associations list */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase">Écoles associées</p>
                {links.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4 border rounded-xl border-dashed">
                    Ce promoteur n'est rattaché à aucun établissement.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {links.map((link) => (
                      <div key={link.establishment_id} className="p-3 border rounded-xl flex items-center justify-between bg-card">
                        <div className="flex items-center gap-2">
                          <School className="w-4 h-4 text-brand-500" />
                          <div>
                            <p className="text-xs font-bold text-foreground">{link.establishment?.name || "—"}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">/{link.establishment?.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 font-sans border-brand-500/20 text-brand-500">
                            {roleLabels[link.role] || link.role}
                          </Badge>
                          <Button
                            onClick={() => setSchoolToDissociate(link.establishment_id)}
                            size="icon-xs"
                            variant="ghost"
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                            title="Retirer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4">
            <Button onClick={() => setIsLinksOpen(false)} className="bg-slate-800 text-white hover:bg-slate-700 h-8 text-xs font-sans">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Password Dialog */}
      <Dialog open={!!tempPassword} onOpenChange={(open) => !open && setTempPassword(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-500 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Compte propriétaire créé !
            </DialogTitle>
            <DialogDescription>
              Le promoteur a été enregistré dans Supabase Auth. Veuillez lui transmettre son mot de passe temporaire :
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted/30 border rounded-xl font-mono text-center text-lg font-bold select-all text-foreground">
            {tempPassword}
          </div>
          <DialogFooter>
            <Button onClick={() => setTempPassword(null)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-sans text-xs">
              J'ai copié le mot de passe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Confirm Dialogs */}
      <ConfirmDialog
        open={!!ownerToDelete}
        onOpenChange={(open) => !open && setOwnerToDelete(null)}
        title="Supprimer le propriétaire"
        description={`Voulez-vous vraiment supprimer le propriétaire ${ownerToDelete?.name} ? Cette action supprimera également ses identifiants d'accès.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={onConfirmDeleteOwner}
        isLoading={deleting}
        variant="destructive"
      />

      <ConfirmDialog
        open={!!schoolToDissociate}
        onOpenChange={(open) => !open && setSchoolToDissociate(null)}
        title="Détacher l'établissement"
        description="Voulez-vous vraiment retirer ce propriétaire de cet établissement ?"
        confirmLabel="Retirer"
        cancelLabel="Annuler"
        onConfirm={onConfirmDissociate}
        isLoading={linking}
        variant="destructive"
      />
    </div>
  );
}
