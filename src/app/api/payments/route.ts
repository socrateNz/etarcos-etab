import { NextResponse } from "next/server";
import { listPayments, createPaymentAction } from "@/features/payments/actions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const res = await listPayments({
    establishment_id: searchParams.get("establishment_id") || undefined,
  });

  if (res.error) {
    const status = res.error === "Non autorisé." || res.error === "Permission refusée." ? 403 : 500;
    return NextResponse.json({ error: res.error }, { status });
  }

  const list = res.data!.data.map((p) => ({
    id: p.id,
    student: p.student?.user?.name || "Élève inconnu",
    fee: p.fee_category?.name || "Frais scolaires",
    amount: Number(p.amount_paid || 0),
    date: p.payment_date || p.created_at.split("T")[0],
    method: p.payment_method || "mobile_money",
    status: p.status,
  }));

  return NextResponse.json({ data: list });
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
  }

  const res = await createPaymentAction({
    student_id: body.studentId,
    fee_category_id: body.feeCategoryId,
    amount_paid: body.amountPaid,
    payment_method: body.paymentMethod || "cash",
    notes: body.notes,
    establishment_id: body.establishment_id,
  });

  if (res.error) {
    const status = res.error === "Non autorisé." || res.error === "Permission refusée." ? 403 : 400;
    return NextResponse.json({ error: res.error }, { status });
  }

  return NextResponse.json({ success: true, data: res.data }, { status: 201 });
}
