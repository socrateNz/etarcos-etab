"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Session } from "next-auth";
import {
  User, Mail, Phone, MapPin, Calendar, Shield,
  Camera, Save, Key, AlertCircle, Edit3, BadgeCheck, Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import { updateMyProfileAction, changeMyPasswordAction } from "@/actions/account";

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string; scope: string }> = {
  super_admin: { label: "Super Administrateur", color: "#a855f7", bg: "bg-purple-500/10 text-purple-400 border-purple-500/30", scope: "Accès à toute la plateforme : établissements, abonnements et configuration système." },
  owner: { label: "Propriétaire", color: "#f59e0b", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30", scope: "Accès aux établissements dont vous êtes propriétaire." },
  director: { label: "Directeur", color: "#3b82f6", bg: "bg-blue-500/10 text-blue-400 border-blue-500/30", scope: "Gestion complète de votre établissement." },
  censor: { label: "Censeur", color: "#0ea5e9", bg: "bg-sky-500/10 text-sky-400 border-sky-500/30", scope: "Suivi pédagogique, discipline et présences de votre établissement." },
  accountant: { label: "Comptable", color: "#14b8a6", bg: "bg-teal-500/10 text-teal-400 border-teal-500/30", scope: "Paiements, dépenses et comptabilité de votre établissement." },
  teacher: { label: "Enseignant", color: "#10b981", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", scope: "Vos classes : notes, présences et emploi du temps." },
  secretary: { label: "Secrétaire", color: "#6366f1", bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30", scope: "Inscriptions, dossiers élèves et documents de votre établissement." },
  librarian: { label: "Bibliothécaire", color: "#8b5cf6", bg: "bg-violet-500/10 text-violet-400 border-violet-500/30", scope: "Catalogue et prêts de la bibliothèque." },
  lab_manager: { label: "Responsable laboratoire", color: "#ec4899", bg: "bg-pink-500/10 text-pink-400 border-pink-500/30", scope: "Inventaire et matériel du laboratoire." },
  parent: { label: "Parent", color: "#f97316", bg: "bg-orange-500/10 text-orange-400 border-orange-500/30", scope: "Suivi de vos enfants : notes, présences, paiements." },
  student: { label: "Élève", color: "#6b7280", bg: "bg-gray-500/10 text-gray-400 border-gray-500/30", scope: "Votre scolarité : notes, présences, emploi du temps." },
};

const profileSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Minimum 8 caractères").max(72, "Maximum 72 caractères"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

interface UserProfile {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  avatar_url?: string | null;
  is_active?: boolean | null;
  email_verified?: boolean | null;
  created_at?: string | null;
}

interface ProfileClientProps {
  session: Session;
  userProfile: UserProfile | null;
}

export function ProfileClient({ session, userProfile }: ProfileClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(userProfile ?? {});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userProfile?.avatar_url ?? session.user.image ?? null);

  const role = session.user.role as string;
  const roleMeta = ROLE_LABELS[role] ?? ROLE_LABELS.student;
  const displayName = profile.name ?? session.user.name ?? session.user.email ?? "";

  const initials = (displayName || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userProfile?.name ?? session.user.name ?? "",
      phone: userProfile?.phone ?? "",
      address: userProfile?.address ?? "",
    },
  });

  const {
    register: registerPwd,
    handleSubmit: handlePwdSubmit,
    formState: { errors: pwdErrors, isSubmitting: isPwdSubmitting },
    reset: resetPwd,
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const saveAvatar = async (url: string | null) => {
    const res = await updateMyProfileAction({
      name: profile.name ?? session.user.name ?? "",
      phone: profile.phone ?? null,
      address: profile.address ?? null,
      avatar_url: url,
    });
    if (res.error) {
      toast.error("Photo non enregistrée", { description: res.error });
      return;
    }
    setAvatarUrl(url);
    router.refresh();
  };

  const { fileInputRef, isUploading, handleUploadClick, handleFileChange } = useAvatarUpload((url) => {
    void saveAvatar(url);
  });

  const onSaveProfile = async (data: ProfileForm) => {
    const res = await updateMyProfileAction(data);
    if (res.error) {
      toast.error("Profil non enregistré", { description: res.error });
      return;
    }
    setProfile((p) => ({ ...p, name: data.name, phone: data.phone || null, address: data.address || null }));
    reset(data);
    toast.success("Profil enregistré");
    router.refresh();
  };

  const onChangePassword = async (data: PasswordForm) => {
    const res = await changeMyPasswordAction({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    if (res.error) {
      toast.error("Mot de passe inchangé", { description: res.error });
      return;
    }
    resetPwd();
    toast.success("Mot de passe mis à jour", {
      description: "Utilisez le nouveau mot de passe à votre prochaine connexion.",
    });
  };

  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const isActive = profile.is_active !== false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon Profil</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos informations personnelles et la sécurité de votre compte
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="overflow-hidden">
            <div
              className="h-24 w-full relative"
              style={{
                background: `linear-gradient(135deg, ${roleMeta.color}33, ${roleMeta.color}11)`,
                borderBottom: `1px solid ${roleMeta.color}22`,
              }}
            />

            <CardContent className="pt-0 pb-6">
              <div className="flex flex-col items-center -mt-10 gap-3">
                <div className="relative group">
                  <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                    <AvatarImage src={avatarUrl ?? undefined} />
                    <AvatarFallback
                      className="text-xl font-bold"
                      style={{ background: `${roleMeta.color}22`, color: roleMeta.color }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    title="Changer la photo"
                    aria-label="Changer la photo"
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="text-center">
                  <h2 className="font-semibold text-lg leading-tight">{displayName}</h2>
                  <p className="text-sm text-muted-foreground">{session.user.email}</p>
                  <Badge variant="outline" className={cn("mt-2 text-xs", roleMeta.bg)}>
                    <Shield className="w-3 h-3 mr-1" />
                    {roleMeta.label}
                  </Badge>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{session.user.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{profile.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Membre depuis {joinDate}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Statut du compte
                </p>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-emerald-500" : "bg-destructive")} />
                  <span className={cn("text-sm font-medium", isActive ? "text-emerald-500" : "text-destructive")}>
                    {isActive ? "Actif" : "Désactivé"}
                  </span>
                </div>
                {profile.email_verified && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <BadgeCheck className="w-4 h-4 text-blue-500" />
                    <span>Email vérifié</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Tabs defaultValue="info">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="info" className="gap-2">
                <Edit3 className="w-4 h-4" />
                Informations
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Key className="w-4 h-4" />
                Sécurité
              </TabsTrigger>
            </TabsList>

            {/* ── INFO TAB ─────────────────────────────────── */}
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>
                    Mettez à jour vos informations de profil visibles dans la plateforme.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom complet</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="name" {...register("name")} className="pl-9" placeholder="Votre nom complet" />
                        </div>
                        {errors.name && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Adresse e-mail</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="email" value={session.user.email ?? ""} disabled className="pl-9 opacity-60" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Pour changer d&apos;email, contactez l&apos;administration de votre établissement.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="phone" {...register("phone")} className="pl-9" placeholder="+237 6XX XXX XXX" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Adresse</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="address" {...register("address")} className="pl-9" placeholder="Ville, Pays" />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Rôle & Accès</Label>
                      <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" style={{ color: roleMeta.color }} />
                          <span className="text-sm font-medium">{roleMeta.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{roleMeta.scope}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <Button type="submit" disabled={!isDirty || isSubmitting} className="gap-2">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Enregistrer les modifications
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── SECURITY TAB ─────────────────────────────── */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Changer le mot de passe
                  </CardTitle>
                  <CardDescription>
                    Utilisez un mot de passe fort d&apos;au moins 8 caractères.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePwdSubmit(onChangePassword)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        autoComplete="current-password"
                        {...registerPwd("currentPassword")}
                        placeholder="••••••••"
                      />
                      {pwdErrors.currentPassword && (
                        <p className="text-xs text-destructive">{pwdErrors.currentPassword.message}</p>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          autoComplete="new-password"
                          {...registerPwd("newPassword")}
                          placeholder="••••••••"
                        />
                        {pwdErrors.newPassword && (
                          <p className="text-xs text-destructive">{pwdErrors.newPassword.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          {...registerPwd("confirmPassword")}
                          placeholder="••••••••"
                        />
                        {pwdErrors.confirmPassword && (
                          <p className="text-xs text-destructive">{pwdErrors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
                        Mot de passe actuel oublié ?
                      </Link>
                      <Button type="submit" variant="outline" disabled={isPwdSubmitting} className="gap-2">
                        {isPwdSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                        Mettre à jour le mot de passe
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
