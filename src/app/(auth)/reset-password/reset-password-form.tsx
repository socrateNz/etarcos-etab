"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordWithTokenAction } from "@/actions/account";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirm) return setError("Les deux mots de passe ne correspondent pas.");

    setIsLoading(true);
    try {
      const res = await resetPasswordWithTokenAction({ token, newPassword: password });
      if (res.error) setError(res.error);
      else setDone(true);
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-800 dark:text-slate-100">
            Votre mot de passe a été modifié. Vous pouvez vous connecter.
          </p>
        </div>
        <Link
          href="/login"
          className="flex h-11 w-full items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Nouveau mot de passe</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Choisissez un mot de passe d&apos;au moins 8 caractères.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pr-10"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmer le mot de passe</Label>
          <Input
            id="confirm"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11"
            disabled={isLoading}
          />
        </div>
        {error && (
          <p className="text-xs text-rose-500 font-medium">
            {error}{" "}
            {error.includes("expiré") && (
              <Link href="/forgot-password" className="underline">
                Nouvelle demande
              </Link>
            )}
          </p>
        )}
        <Button type="submit" className="w-full h-11" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer le mot de passe"}
        </Button>
      </form>
    </div>
  );
}
