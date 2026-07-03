"use client";

import { Printer, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { PaymentWithRelations } from "../types";

interface ReceiptDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentWithRelations | null;
}

const methodLabels: Record<string, string> = {
  cash: "Espèces",
  check: "Chèque",
  card: "Carte Bancaire",
  mobile_money: "Mobile Money",
  transfer: "Virement bancaire",
};

export function ReceiptDetailsDialog({
  open,
  onOpenChange,
  payment,
}: ReceiptDetailsDialogProps) {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <DollarSign className="w-5 h-5 text-emerald-500" /> Reçu de Caisse
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="border border-dashed p-4 rounded-xl bg-muted/10 print:border-solid print:p-6 print:bg-white">
            <div className="text-center pb-4 border-b">
              <h3 className="font-bold text-lg text-foreground print:text-black">ETARCOS ETAB</h3>
              <p className="text-xs text-muted-foreground print:text-black">Reçu de Caisse Officiel</p>
            </div>

            <div className="space-y-3 pt-4 text-sm print:text-black">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Numéro de reçu :</span>
                <span className="font-mono font-semibold text-brand-500">{payment.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nom de l'élève :</span>
                <span className="font-semibold">{payment.student?.user?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Matricule :</span>
                <span className="font-mono text-xs">{payment.student?.student_number || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Classe :</span>
                <span className="font-medium">{payment.student?.classroom?.name || "Pas de classe"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Libellé des frais :</span>
                <span className="font-medium">{payment.fee_category?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date d'encaissement :</span>
                <span>{payment.payment_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode de règlement :</span>
                <span className="font-medium capitalize">{methodLabels[payment.payment_method || "cash"] || payment.payment_method}</span>
              </div>
              {payment.notes && (
                <div className="pt-2 border-t text-xs">
                  <span className="font-semibold text-muted-foreground">Notes / Référence :</span>
                  <p className="text-muted-foreground mt-0.5">{payment.notes}</p>
                </div>
              )}
              <div className="flex justify-between border-t pt-3 text-base font-bold">
                <span className="text-foreground">Total Dû :</span>
                <span className="text-foreground">{formatCurrency(payment.amount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span className="text-foreground">Montant Réglé :</span>
                <span className="text-emerald-500">{formatCurrency(payment.amount_paid)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span className="text-foreground">Reste à payer :</span>
                <span className="text-rose-500">{formatCurrency(payment.balance)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 no-print">
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" /> Imprimer le reçu
          </Button>
          <Button onClick={() => onOpenChange(false)} className="bg-brand-500 hover:bg-brand-600 text-white">
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
