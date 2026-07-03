"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Zap, Lock, Mail, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterInput } from "@/schemas/auth";
import { registerAction } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true);
    try {
      const response = await registerAction(data);

      if (response.error) {
        toast.error("Erreur d'inscription", {
          description: response.error,
        });
      } else {
        toast.success("Compte propriétaire créé !", {
          description: "Vous pouvez maintenant vous connecter avec vos identifiants.",
        });
        router.push("/login");
      }
    } catch {
      toast.error("Erreur serveur", {
        description: "Une erreur inattendue est survenue.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      {/* Mobile logo */}
      <div className="flex items-center gap-3 mb-8 lg:hidden">
        <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <p className="text-lg font-bold">Etarcos Etab</p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Créer un compte</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Inscrivez-vous en tant que propriétaire d'établissement, ou{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            connectez-vous
          </Link> si vous avez déjà un compte.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">
            Nom complet
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="Jean Dupont"
              className={cn(
                "pl-10",
                errors.name && "border-destructive focus-visible:ring-destructive"
              )}
              disabled={isLoading}
              {...register("name")}
            />
          </div>
          {errors.name && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive font-medium"
            >
              {errors.name.message}
            </motion.p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            Adresse email administrative
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="proprietaire@etablissement.com"
              className={cn(
                "pl-10",
                errors.email && "border-destructive focus-visible:ring-destructive"
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

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">
            Mot de passe
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={cn(
                "pl-10 pr-10",
                errors.password && "border-destructive focus-visible:ring-destructive"
              )}
              disabled={isLoading}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirmer le mot de passe
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              className={cn(
                "pl-10 pr-10",
                errors.confirmPassword && "border-destructive focus-visible:ring-destructive"
              )}
              disabled={isLoading}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive font-medium"
            >
              {errors.confirmPassword.message}
            </motion.p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full bg-brand-gradient hover:opacity-95 text-white transition-opacity gap-2 font-medium mt-2"
          disabled={isLoading || !isValid}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Création du compte...
            </>
          ) : (
            <>
              Créer mon compte
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-[10px] text-muted-foreground mt-6 leading-normal">
        En créant un compte, vous acceptez nos{" "}
        <span className="text-primary cursor-pointer hover:underline">
          Conditions d&apos;utilisation
        </span>{" "}
        et notre{" "}
        <span className="text-primary cursor-pointer hover:underline">
          Politique de confidentialité
        </span>
        .
      </p>
    </motion.div>
  );
}
