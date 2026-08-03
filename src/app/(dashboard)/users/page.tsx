"use client";

import { useEffect, useState } from "react";
import { Users, Search, Trash2, Mail, Loader2, CheckSquare, XCircle, UserPlus, KeyRound, Copy, Check } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { updateUserStatusAction, deleteUserAction } from "@/app/actions/superadmin";
import { listUsersScopedAction, resetUserPasswordAction } from "@/features/users/actions";
import { UserFormDialog } from "@/components/common/user-form-dialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  requires_password_change?: boolean;
  establishment?: {
    name: string;
  } | null;
}

const roleColors: Record<string, string> = {
  super_admin: "bg-red-500/10 text-red-500 border-red-500/20",
  owner: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  director: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  censor: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  accountant: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  teacher: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  secretary: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  librarian: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  lab_manager: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  student: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  parent: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  owner: "Propriétaire",
  director: "Directeur Etab",
  censor: "Censeur",
  accountant: "Comptable",
  teacher: "Enseignant",
  secretary: "Secrétaire",
  librarian: "Bibliothécaire",
  lab_manager: "Resp. Labo",
  student: "Élève",
  parent: "Parent",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userFormOpen, setUserFormOpen] = useState(false);

  // Reset password states
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{ name: string; email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Confirmation dialog states
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await listUsersScopedAction();
    if (res.data) {
      setUsers(res.data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    const res = await updateUserStatusAction(user.id, nextStatus);
    if (res.success) {
      fetchUsers();
    }
  };

  const handleResetPassword = async (user: User) => {
    setResettingId(user.id);
    const res = await resetUserPasswordAction(user.id);
    if (res.success && res.data) {
      setResetResult(res.data);
      fetchUsers();
    }
    setResettingId(null);
  };

  const handleCopyCredentials = () => {
    if (!resetResult) return;
    const text = `Identifiants pour ${resetResult.name} :\nEmail : ${resetResult.email}\nMot de passe temporaire : ${resetResult.tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    const res = await deleteUserAction(userToDelete.id);
    if (res.success) {
      setUserToDelete(null);
      fetchUsers();
    }
    setDeleting(false);
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Comptes Utilisateurs"
          description="Consultez et gérez l'ensemble des comptes utilisateurs rattachés à votre structure."
          icon={Users}
        />
        <Button onClick={() => setUserFormOpen(true)} className="gap-2 self-start sm:self-auto">
          <UserPlus className="w-4 h-4" />
          Créer un utilisateur
        </Button>
      </div>

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
            <p className="text-sm">Chargement des utilisateurs...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20 text-brand-500" />
            <h3 className="font-semibold text-foreground mb-1">Aucun utilisateur</h3>
            <p className="text-sm">Aucun compte ne correspond à votre recherche.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">Adresse e-mail</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4">Établissement</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/5 transition-colors">
                    <td className="p-4 font-semibold text-foreground">{u.name}</td>
                    <td className="p-4 text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {u.email}</span>
                    </td>
                    <td className="p-4">
                      <Badge className={`border ${roleColors[u.role] || ""}`}>
                        {roleLabels[u.role] || u.role}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium text-muted-foreground">
                      {u.establishment?.name || <span className="text-red-500 font-mono text-xs">SuperAdmin</span>}
                    </td>
                    <td className="p-4">
                      <Badge variant={u.status === "active" ? "default" : "secondary"}>
                        {u.status === "active" ? "Actif" : "Suspendu"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex gap-1.5">
                        {u.requires_password_change !== false && (
                          <Button
                            onClick={() => handleResetPassword(u)}
                            size="icon-xs"
                            variant="ghost"
                            title="Générer / Réinitialiser un mot de passe temporaire"
                            disabled={resettingId === u.id}
                            className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10"
                          >
                            {resettingId === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <KeyRound className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        )}
                        <Button
                          onClick={() => handleToggleStatus(u)}
                          size="icon-xs"
                          variant="ghost"
                          title={u.status === "active" ? "Suspendre" : "Activer"}
                          className={u.status === "active" ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10" : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"}
                        >
                          {u.status === "active" ? <XCircle className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          onClick={() => setUserToDelete(u)}
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

      {/* Creation Modal */}
      <UserFormDialog
        open={userFormOpen}
        onOpenChange={setUserFormOpen}
        onSuccess={fetchUsers}
      />

      {/* Reset Credentials Result Modal */}
      <Dialog open={!!resetResult} onOpenChange={(open) => !open && setResetResult(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-500" />
              Nouveau Mot de Passe Temporaire
            </DialogTitle>
            <DialogDescription className="text-xs">
              Un mot de passe temporaire a été généré pour {resetResult?.name}. Transmettez-le à l'utilisateur.
            </DialogDescription>
          </DialogHeader>

          {resetResult && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground font-medium">Identifiant (Email) :</span>
                  <p className="font-bold text-foreground font-mono mt-0.5">{resetResult.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Mot de passe temporaire :</span>
                  <p className="font-bold text-primary font-mono text-sm mt-0.5">{resetResult.tempPassword}</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px]">
                ℹ️ Ce bouton disparaîtra automatiquement dès que {resetResult.name} se sera connecté et aura modifié ce mot de passe.
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handleCopyCredentials} variant="outline" className="flex-1 gap-2 text-xs">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copié dans le presse-papier !" : "Copier les identifiants"}
                </Button>
                <Button onClick={() => setResetResult(null)} size="sm">
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        title="Supprimer l'utilisateur"
        description={`Voulez-vous vraiment supprimer l'utilisateur ${userToDelete?.name} ? Cette action est irréversible et supprimera définitivement ses données d'accès.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={onConfirmDeleteUser}
        isLoading={deleting}
        variant="destructive"
      />
    </div>
  );
}
