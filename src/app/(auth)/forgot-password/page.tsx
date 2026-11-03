"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction } from "@/actions/account";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await requestPasswordResetAction({ email });
      if (res.error) setError(res.error);
      else setSentMessage(res.message ?? "Email envoyé.");
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Mot de passe oublié
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Saisissez l&apos;adresse email de votre compte. Vous recevrez un lien pour choisir un nouveau mot de passe.
        </p>
      </div>

      {sentMessage ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="text-slate-800 dark:text-slate-100">{sentMessage}</p>
            <p className="text-slate-500 dark:text-slate-400">
              Pensez à vérifier vos courriers indésirables. Sans email après quelques minutes, contactez
              l&apos;administration de votre établissement.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@etablissement.com"
                className="h-11 pr-10"
                disabled={isLoading}
              />
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
          <Button type="submit" className="w-full h-11" disabled={isLoading || !email}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Envoyer le lien"}
          </Button>
        </form>
      )}

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la connexion
      </Link>
    </div>
  );
}
