"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Session } from "next-auth";
import {
  User, Mail, Phone, MapPin, Calendar, Shield,
  Camera, Save, Key, Bell, Globe, Lock,
  CheckCircle2, AlertCircle, Edit3, BadgeCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  super_admin: { label: "Super Administrateur", color: "#a855f7", bg: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  owner: { label: "Propriétaire", color: "#f59e0b", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  director: { label: "Directeur", color: "#3b82f6", bg: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  teacher: { label: "Enseignant", color: "#10b981", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  student: { label: "Élève", color: "#6b7280", bg: "bg-gray-500/10 text-gray-400 border-gray-500/30" },
};

const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Minimum 6 caractères"),
  newPassword: z.string().min(8, "Minimum 8 caractères"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

interface ProfileClientProps {
  session: Session;
  userProfile: any;
}

export function ProfileClient({ session, userProfile }: ProfileClientProps) {
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    platform: true,
    security: true,
    reports: false,
  });

  const role = session.user.role as string;
  const roleMeta = ROLE_LABELS[role] ?? ROLE_LABELS.student;

  const initials = (session.user.name ?? session.user.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
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
    formState: { errors: pwdErrors },
    reset: resetPwd,
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onSaveProfile = async (data: ProfileForm) => {
    // TODO: call server action to update profile
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const onChangePassword = async (data: PasswordForm) => {
    // TODO: call server action to change password
    resetPwd();
  };

  const joinDate = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon Profil</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos informations personnelles et préférences de compte
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
            {/* Banner */}
            <div
              className="h-24 w-full relative"
              style={{
                background: `linear-gradient(135deg, ${roleMeta.color}33, ${roleMeta.color}11)`,
                borderBottom: `1px solid ${roleMeta.color}22`,
              }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 50%, ${roleMeta.color} 0%, transparent 50%)`,
                }}
              />
            </div>

            <CardContent className="pt-0 pb-6">
              {/* Avatar */}
              <div className="flex flex-col items-center -mt-10 gap-3">
                <div className="relative group">
                  <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                    <AvatarImage src={session.user.image ?? undefined} />
                    <AvatarFallback
                      className="text-xl font-bold"
                      style={{ background: `${roleMeta.color}22`, color: roleMeta.color }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    title="Changer la photo"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="text-center">
                  <h2 className="font-semibold text-lg leading-tight">
                    {session.user.name ?? "Super Admin"}
                  </h2>
                  <p className="text-sm text-muted-foreground">{session.user.email}</p>
                  <Badge variant="outline" className={cn("mt-2 text-xs", roleMeta.bg)}>
                    <Shield className="w-3 h-3 mr-1" />
                    {roleMeta.label}
                  </Badge>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Quick Stats */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{session.user.email}</span>
                </div>
                {userProfile?.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{userProfile.phone}</span>
                  </div>
                )}
                {userProfile?.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{userProfile.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Membre depuis {joinDate}</span>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Account Status */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Statut du compte
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm text-emerald-500 font-medium">Actif</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <BadgeCheck className="w-4 h-4 text-blue-500" />
                  <span>Email vérifié</span>
                </div>
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
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="info" className="gap-2">
                <Edit3 className="w-4 h-4" />
                Informations
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Lock className="w-4 h-4" />
                Sécurité
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                Notifications
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
                          <Input
                            id="name"
                            {...register("name")}
                            className="pl-9"
                            placeholder="Votre nom complet"
                          />
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
                          <Input
                            id="email"
                            value={session.user.email ?? ""}
                            disabled
                            className="pl-9 opacity-60"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          L'email ne peut pas être modifié directement.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            {...register("phone")}
                            className="pl-9"
                            placeholder="+237 6XX XXX XXX"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Adresse</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="address"
                            {...register("address")}
                            className="pl-9"
                            placeholder="Ville, Pays"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Role & Permissions */}
                    <div className="space-y-2">
                      <Label>Rôle & Accès</Label>
                      <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" style={{ color: roleMeta.color }} />
                            <span className="text-sm font-medium">{roleMeta.label}</span>
                          </div>
                          <Badge variant="outline" className={cn("text-xs", roleMeta.bg)}>
                            Accès global
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          En tant que Super Administrateur, vous avez accès à toutes les fonctionnalités
                          de la plateforme SaaS Etarcos Etab, y compris la gestion des établissements,
                          des souscriptions et de la configuration système.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      {saved && (
                        <motion.span
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-sm text-emerald-500 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Sauvegardé !
                        </motion.span>
                      )}
                      <Button type="submit" disabled={!isDirty} className="gap-2">
                        <Save className="w-4 h-4" />
                        Enregistrer les modifications
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── SECURITY TAB ─────────────────────────────── */}
            <TabsContent value="security">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      Changer le mot de passe
                    </CardTitle>
                    <CardDescription>
                      Utilisez un mot de passe fort d'au moins 8 caractères.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePwdSubmit(onChangePassword)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                        <Input
                          id="currentPassword"
                          type="password"
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
                            {...registerPwd("confirmPassword")}
                            placeholder="••••••••"
                          />
                          {pwdErrors.confirmPassword && (
                            <p className="text-xs text-destructive">{pwdErrors.confirmPassword.message}</p>
                          )}
                        </div>
                      </div>
                      <Button type="submit" variant="outline" className="gap-2">
                        <Key className="w-4 h-4" />
                        Mettre à jour le mot de passe
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Sessions actives
                    </CardTitle>
                    <CardDescription>
                      Appareils actuellement connectés à votre compte.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Session actuelle</p>
                        <p className="text-xs text-muted-foreground">Navigateur Web · Yaoundé, Cameroun</p>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                        Active
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── NOTIFICATIONS TAB ────────────────────────── */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Préférences de notifications
                  </CardTitle>
                  <CardDescription>
                    Choisissez les événements pour lesquels vous souhaitez être notifié.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      key: "email" as const,
                      title: "Notifications par e-mail",
                      desc: "Recevoir les alertes importantes par e-mail",
                    },
                    {
                      key: "platform" as const,
                      title: "Notifications in-app",
                      desc: "Alertes dans l'interface de la plateforme",
                    },
                    {
                      key: "security" as const,
                      title: "Alertes de sécurité",
                      desc: "Connexions inhabituelles, tentatives d'accès",
                    },
                    {
                      key: "reports" as const,
                      title: "Rapports hebdomadaires",
                      desc: "Résumé d'activité et statistiques de la plateforme",
                    },
                  ].map(({ key, title, desc }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{title}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Switch
                        checked={notifications[key]}
                        onCheckedChange={(v) => setNotifications((n) => ({ ...n, [key]: v }))}
                      />
                    </div>
                  ))}

                  <div className="flex justify-end pt-2">
                    <Button className="gap-2">
                      <Save className="w-4 h-4" />
                      Enregistrer les préférences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
