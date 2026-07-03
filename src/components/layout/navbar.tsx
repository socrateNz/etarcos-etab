"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import {
  Search, Bell, Sun, Moon, LogOut, Settings, User,
  ChevronDown, Menu, X, Command, Building,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/store/ui-store";
import { useSidebarStore } from "@/store/sidebar-store";
import { useBreakpoint } from "@/hooks/use-media-query";
import { useQuery } from "@tanstack/react-query";
import { listEstablishments } from "@/features/establishments/actions";
import { useOwnerStore } from "@/store/owner-store";
import { cn, getInitials, formatRelativeDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SYSTEM_ROLES } from "@/types/auth";
import Link from "next/link";

// Mock notifications for demo
const MOCK_NOTIFICATIONS = [
  { id: "1", title: "Nouveau paiement", message: "Paul Martin a payé 75 000 FCFA", time: "2026-06-30T09:00:00Z", type: "success" as const, isRead: false },
  { id: "2", title: "Bulletin publié", message: "Les bulletins du T2 sont disponibles", time: "2026-06-30T08:30:00Z", type: "info" as const, isRead: false },
  { id: "3", title: "Absence signalée", message: "3 élèves absents en classe de 3ème A", time: "2026-06-30T07:45:00Z", type: "warning" as const, isRead: true },
];

export function Navbar() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toggleCommand, isNotificationsOpen, setNotificationsOpen } = useUIStore();
  const { toggleSidebar, isOpen } = useSidebarStore();
  const { isMobile } = useBreakpoint();
  const [searchFocus, setSearchFocus] = useState(false);

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;
  const roleMeta = user?.role ? SYSTEM_ROLES[user.role] : null;

  const { mode, selectedEstablishmentId, compareIds, setMode, setSelectedEstablishmentId, toggleCompareId } = useOwnerStore();

  const { data: etabs = [] } = useQuery({
    queryKey: ["navbar-establishments"],
    queryFn: async () => {
      const res = await listEstablishments({ per_page: 50 });
      if (res.error) throw new Error(res.error);
      return res.data?.data ?? [];
    },
    enabled: user?.role === "owner" || user?.role === "super_admin",
  });

  useState(() => {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/);
      const cookieValue = match ? decodeURIComponent(match[1]) : null;
      if (cookieValue) {
        if (cookieValue === "global" || cookieValue === "compare") {
          if (mode !== cookieValue) setMode(cookieValue as any);
        } else {
          if (selectedEstablishmentId !== cookieValue) {
            setSelectedEstablishmentId(cookieValue);
            if (mode !== "single") setMode("single");
          }
        }
      } else {
        document.cookie = `active_establishment_id=global; path=/; max-age=31536000; SameSite=Lax`;
        if (mode !== "global") setMode("global");
      }
    }
  });

  const activeEtabName = etabs.find(e => e.id === selectedEstablishmentId)?.name;

  const handleModeSwitch = (newMode: "global" | "compare") => {
    setMode(newMode);
    if (typeof window !== "undefined") {
      document.cookie = `active_establishment_id=${newMode}; path=/; max-age=31536000; SameSite=Lax`;
    }
    router.refresh();
  };

  const handleSelectEtab = (etabId: string) => {
    setSelectedEstablishmentId(etabId);
    setMode("single");
    if (typeof window !== "undefined") {
      document.cookie = `active_establishment_id=${etabId}; path=/; max-age=31536000; SameSite=Lax`;
    }
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-4 gap-4">
      {/* Mobile menu toggle */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {/* Search bar */}
      <div className="flex-1 max-w-lg">
        <div
          className={cn(
            "relative flex items-center transition-all duration-200",
            searchFocus && "ring-2 ring-primary rounded-lg"
          )}
        >
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher... (⌘K)"
            className="pl-9 pr-16 bg-muted/50 border-transparent focus:border-transparent focus-visible:ring-0 cursor-pointer"
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            onClick={toggleCommand}
            readOnly
          />
          <div className="absolute right-3 flex items-center gap-1">
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-background border border-border text-muted-foreground">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Establishment selector (if multiple / owner / super_admin) */}
        {(user?.role === "owner" || user?.role === "super_admin") && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2 text-muted-foreground hover:bg-muted/50 border border-border/50 px-3 py-1.5 h-9 rounded-lg">
                  <Building className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold">
                    {mode === "global" && "Vue globale"}
                    {mode === "single" && (activeEtabName || "Sélectionner...")}
                    {mode === "compare" && "Comparaison"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Modes de consultation
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleModeSwitch("global")}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span>Vue globale (Consolidée)</span>
                </div>
                {mode === "global" && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Vue par établissement
              </DropdownMenuLabel>
              {etabs.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground italic">Aucun établissement</div>
              ) : (
                etabs.map((etab) => (
                  <DropdownMenuItem
                    key={etab.id}
                    onClick={() => handleSelectEtab(etab.id)}
                    className="flex items-center justify-between pl-4"
                  >
                    <span className="truncate">{etab.name}</span>
                    {mode === "single" && selectedEstablishmentId === etab.id && (
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    )}
                  </DropdownMenuItem>
                ))
              )}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Comparaison
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleModeSwitch("compare")}
                className="flex items-center justify-between"
              >
                <span>Activer le mode comparaison</span>
                {mode === "compare" && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
              </DropdownMenuItem>
              {etabs.map((etab) => {
                const isComparing = compareIds.includes(etab.id);
                return (
                  <DropdownMenuItem
                    key={etab.id}
                    onClick={() => toggleCompareId(etab.id)}
                    className="flex items-center justify-between pl-6 text-xs text-muted-foreground focus:text-foreground animate-in fade-in-5 duration-100"
                  >
                    <span className="truncate">{etab.name}</span>
                    <input
                      type="checkbox"
                      checked={isComparing}
                      onChange={() => {}}
                      className="w-3 h-3 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                    />
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground hover:text-foreground"
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === "dark" ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationsOpen(!isNotificationsOpen)}
            className="relative text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full"
              >
                {unreadCount}
              </motion.span>
            )}
          </Button>

          {/* Notifications panel */}
          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-80 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Notifications</p>
                    <p className="text-xs text-muted-foreground">{unreadCount} non lues</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {MOCK_NOTIFICATIONS.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                        !notif.isRead && "bg-primary/5"
                      )}
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                        notif.type === "success" && "bg-emerald-500",
                        notif.type === "info" && "bg-blue-500",
                        notif.type === "warning" && "bg-amber-500",
                      )} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{notif.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          {formatRelativeDate(notif.time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-border">
                  <Button variant="ghost" size="sm" className="w-full text-primary text-xs">
                    Voir toutes les notifications
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User profile */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="flex items-center gap-2 pl-2 pr-3 rounded-lg h-10 hover:bg-muted/50"
              />
            }
          >
            <Avatar className="w-7 h-7">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name} />
              <AvatarFallback className="bg-brand-gradient text-white text-xs font-bold">
                {getInitials(user?.name ?? "U")}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-medium leading-none">{user?.name}</span>
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                {roleMeta?.label ?? "Utilisateur"}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
                {roleMeta && (
                  <Badge
                    variant="secondary"
                    className="mt-1 text-[10px] h-4"
                    style={{ borderColor: roleMeta.color + "40", color: roleMeta.color }}
                  >
                    {roleMeta.label}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem render={<Link href="/profile" className="flex items-center gap-2" />}>
              <User className="w-4 h-4" />
              Mon profil
            </DropdownMenuItem>

            <DropdownMenuItem render={<Link href="/settings" className="flex items-center gap-2" />}>
              <Settings className="w-4 h-4" />
              Paramètres
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
