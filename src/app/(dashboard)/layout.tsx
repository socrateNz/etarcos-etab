"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { CommandPalette } from "@/components/layout/command-palette";
import { useBreakpoint } from "@/hooks/use-media-query";
import { useCommandPaletteShortcut } from "@/hooks/use-command-palette";
import { useSidebarStore } from "@/store/sidebar-store";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { forceUpdatePasswordAction } from "@/app/actions/owner";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMobile } = useBreakpoint();
  const { isOpen, isCollapsed, setIsOpen } = useSidebarStore();
  const { data: session, status, update } = useSession();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useCommandPaletteShortcut();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Mot de passe trop court", { description: "Le mot de passe doit comporter au moins 8 caractères." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mots de passe différents", { description: "Les deux mots de passe ne correspondent pas." });
      return;
    }

    setIsUpdating(true);
    try {
      const res = await forceUpdatePasswordAction(newPassword);
      if (res.error) {
        toast.error("Erreur de mise à jour", { description: res.error });
      } else {
        toast.success("Mot de passe mis à jour !", { description: "Reconnexion en cours..." });
        await update();
        await signOut({ callbackUrl: "/login" });
      }
    } catch (err: any) {
      toast.error("Erreur inattendue", { description: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  // If session requires password change, restrict layout view and show force change form
  if (status !== "loading" && session?.user?.requires_password_change === true) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-blue-500/20 via-cyan-500/15 to-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md relative z-10 bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 border border-amber-500/20 shadow-lg shadow-amber-500/10 animate-bounce">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Changement de mot de passe requis</h2>
            <p className="text-xs text-muted-foreground/80 mt-2 leading-relaxed">
              Pour des raisons de sécurité, vous devez définir votre propre mot de passe avant d'accéder à votre espace de travail.
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  required
                  className="pl-3 pr-10 py-3 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-muted-foreground/30 focus:border-brand-400 focus:ring-brand-400/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300">Confirmer le mot de passe</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez le mot de passe"
                required
                className="bg-white/5 border-white/10 rounded-xl text-white placeholder:text-muted-foreground/30 focus:border-brand-400 focus:ring-brand-400/20"
              />
            </div>

            <Button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-brand-gradient hover:opacity-95 text-white transition-opacity duration-200 font-semibold h-11 rounded-xl mt-2"
            >
              {isUpdating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mise à jour en cours...
                </div>
              ) : (
                "Enregistrer et continuer"
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <CommandPalette />
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className={cn(
          "no-print",
          isMobile
            ? "fixed left-0 top-0 h-full z-30 transition-transform duration-300"
            : "relative",
          isMobile && !isOpen && "-translate-x-full"
        )}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="no-print">
          <Navbar />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
            {/* Breadcrumb */}
            <div className="mb-4 no-print">
              <Breadcrumb />
            </div>

            {/* Page content */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
