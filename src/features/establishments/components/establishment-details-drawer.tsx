"use client";

import {
  Building2, Mail, MapPin, Phone, Globe, Calendar,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Establishment } from "@/types/database";
import {
  EstablishmentPlanBadge,
  EstablishmentStatusBadge,
} from "./establishment-badges";

interface EstablishmentDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishment: Establishment | null | undefined;
  isLoading?: boolean;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

export function EstablishmentDetailsDrawer({
  open,
  onOpenChange,
  establishment,
  isLoading,
}: EstablishmentDetailsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-brand-500" />
            {establishment?.name ?? "Détails de l'établissement"}
          </DrawerTitle>
          <DrawerDescription>
            {establishment?.slug ? `/${establishment.slug}` : "Chargement…"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto space-y-4">
          {isLoading && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Chargement…
            </p>
          )}

          {establishment && !isLoading && (
            <>
              <div className="flex flex-wrap gap-2">
                <EstablishmentStatusBadge status={establishment.status} />
                <EstablishmentPlanBadge plan={establishment.plan} />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow icon={MapPin} label="Adresse" value={establishment.address} />
                <DetailRow icon={MapPin} label="Ville / Pays" value={
                  [establishment.city, establishment.country].filter(Boolean).join(", ") || null
                } />
                <DetailRow icon={Phone} label="Téléphone" value={establishment.phone} />
                <DetailRow icon={Mail} label="Email" value={establishment.email} />
                <DetailRow icon={Globe} label="Site web" value={establishment.website} />
                <DetailRow icon={Calendar} label="Créé le" value={formatDate(establishment.created_at)} />
              </div>

              <Separator />

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Dernière mise à jour : {formatDateTime(establishment.updated_at)}</p>
                <p className="font-mono">ID : {establishment.id}</p>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
