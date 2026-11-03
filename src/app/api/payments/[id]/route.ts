import { NextResponse } from "next/server";
import {
  getPaymentByIdAction,
  updatePaymentAction,
  deletePaymentAction,
} from "@/features/payments/actions";

// Toutes les opérations passent par les Server Actions, qui vérifient la
// permission (payments:view/edit/delete), l'établissement de l'appelant et le
// périmètre parent / élève. Ces routes ne vérifiaient auparavant que la
// connexion : n'importe quel compte pouvait lire, modifier (ex. passer en
// « payé ») ou supprimer n'importe quel paiement de n'importe quelle école.

function statusFor(error: string): number {
  if (error === "Non autorisé.") return 401;
  if (error === "Permission refusée." || error.startsWith("Vous n'avez pas accès")) return 403;
  if (error.includes("introuvable")) return 404;
  return 400;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await getPaymentByIdAction(id);
  if (res.error || !res.data) {
    const error = res.error ?? "Paiement introuvable.";
    return NextResponse.json({ error }, { status: statusFor(error) });
  }

  const p = res.data;
  return NextResponse.json({
    data: {
      id: p.id,
      student: p.student?.user?.name || "Élève inconnu",
      fee: p.fee_category?.name || "Frais scolaires",
      amount: Number(p.amount || 0),
      amount_paid: Number(p.amount_paid || 0),
      date: p.payment_date || p.created_at.split("T")[0],
      method: p.payment_method || "cash",
      status: p.status,
      notes: p.notes,
    },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
  }

  // Validé par updatePaymentSchema dans l'action.
  const res = await updatePaymentAction(id, {
    amount_paid: body.amount_paid as number,
    payment_method: body.payment_method as never,
    status: body.status as never,
    notes: (body.notes as string | null | undefined) ?? null,
  });

  if (res.error) return NextResponse.json({ error: res.error }, { status: statusFor(res.error) });
  return NextResponse.json({ success: true, data: res.data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await deletePaymentAction(id);
  if (res.error) return NextResponse.json({ error: res.error }, { status: statusFor(res.error) });
  return NextResponse.json({ success: true });
}
