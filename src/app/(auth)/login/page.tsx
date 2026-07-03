"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  GraduationCap,
  School,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/schemas/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Identifiants incorrects", {
          description: "Vérifiez votre email et votre mot de passe.",
          duration: 4000,
        });
      } else {
        toast.success("Connexion réussie !", {
          description: "Bienvenue sur votre espace établissement.",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        });
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Erreur de connexion", {
        description: "Une erreur inattendue est survenue.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-md flex flex-col items-center px-4">
      {/* Background Elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-indigo-500/5 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E')] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full relative z-10 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl shadow-black/60"
      >
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-blue-400/30 blur-xl rounded-xl" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <School className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Etarcos
                <span className="text-sm font-normal text-emerald-400 ml-1.5">Etab</span>
              </h1>
              <p className="text-[10px] text-muted-foreground/60 tracking-wider uppercase">
                Gestion Établissement
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-medium">Sécurisé</span>
          </div>
        </div>

        {/* Welcome Section - Inspired by NeuroFox */}
        <div className="mb-8">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white font-sans tracking-tight"
          >
            Bienvenue
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground/80 mt-2 text-sm leading-relaxed"
          >
            Connectez-vous à votre espace établissement pour gérer vos activités éducatives.
          </motion.p>
        </div>

        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Email Field */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-slate-300/80">
              Adresse email
            </Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-emerald-400 transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="vous@etablissement.com"
                className={cn(
                  "pl-11 pr-4 py-3 bg-white/5 border-white/10 rounded-xl text-white",
                  "placeholder:text-muted-foreground/40",
                  "focus:bg-white/10 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20",
                  "transition-all duration-300",
                  errors.email && "border-destructive/50 focus-visible:ring-destructive/20"
                )}
                disabled={isLoading}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive font-medium"
              >
                {errors.email.message}
              </motion.p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium text-slate-300/80">
                Mot de passe
              </Label>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground/60 hover:text-emerald-400 transition-colors"
                type="button"
              >
                Mot de passe oublié ?
              </Button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-emerald-400 transition-colors" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={cn(
                  "pl-11 pr-12 py-3 bg-white/5 border-white/10 rounded-xl text-white",
                  "placeholder:text-muted-foreground/40",
                  "focus:bg-white/10 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20",
                  "transition-all duration-300",
                  errors.password && "border-destructive/50 focus-visible:ring-destructive/20"
                )}
                disabled={isLoading}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive font-medium"
              >
                {errors.password.message}
              </motion.p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer sr-only"
                />
                <div className={cn(
                  "w-4 h-4 rounded border transition-all duration-300 flex items-center justify-center",
                  rememberMe
                    ? "border-emerald-400 bg-emerald-400/20"
                    : "border-white/20 bg-white/5 group-hover:border-white/40"
                )}>
                  {rememberMe && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </div>
              </div>
              <span className="text-xs text-muted-foreground/70 group-hover:text-white/90 transition-colors">
                Se souvenir de moi
              </span>
            </label>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground/50 hover:text-emerald-400 transition-colors"
            >
              Conditions
            </Link>
          </div>

          {/* Submit Button - NeuroFox Inspired */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="pt-2"
          >
            <Button
              type="submit"
              className={cn(
                "w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500",
                "hover:shadow-xl hover:shadow-emerald-500/30",
                "text-white font-semibold py-6 rounded-xl transition-all duration-300",
                "border border-white/10 group relative overflow-hidden",
                "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
              disabled={isLoading || !isValid}
              size="lg"
            >
              {/* Shine Effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connexion en cours...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </Button>
          </motion.div>
        </motion.form>

        {/* Footer with Educational Context */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
              <GraduationCap className="w-3 h-3 text-emerald-400/70" />
              <span>Éducation</span>
            </div>
            <div className="w-px h-4 bg-white/5" />
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
              <Shield className="w-3 h-3 text-emerald-400/70" />
              <span>Données sécurisées</span>
            </div>
            <div className="w-px h-4 bg-white/5" />
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
              <Building2 className="w-3 h-3 text-blue-400/70" />
              <span>Établissement</span>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/40 mt-3">
            Plateforme de gestion éducative — {new Date().getFullYear()}
          </p>
        </div>
      </motion.div>
    </div>
  );
}