import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveEstablishmentId } from "@/lib/auth/active-etab";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Get payments list
  try {
     const supabase = (await createAdminClient()) as any;
     const estId = (await resolveEstablishmentId(
       session.user.establishment_id
     )) || "00000000-0000-0000-0000-000000000000";

    const { data, error } = await supabase
      .from("payments")
      .select("id, amount, amount_paid, payment_date, payment_method, status, student:students(user:users(name)), fee_category:fee_categories(name)")
      .eq("establishment_id", estId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const list = data.map((p: any) => ({
      id: p.id,
      student: p.student?.user?.name || "Élève inconnu",
      fee: p.fee_category?.name || "Frais scolaires",
      amount: Number(p.amount_paid || 0),
      date: p.payment_date || p.created_at.split('T')[0],
      method: p.payment_method || "mobile_money",
      status: p.status,
    }));

    return NextResponse.json({ data: list });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { studentId, feeCategoryId, amountPaid, paymentMethod, notes } = body;

    if (!studentId || !feeCategoryId || !amountPaid) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const supabase = (await createAdminClient()) as any;
    const estId = (await resolveEstablishmentId(
      session.user.establishment_id,
      body.establishment_id
    )) || "00000000-0000-0000-0000-000000000000";

    // Fetch active academic year
    const { data: academicYear } = await supabase
      .from("academic_years")
      .select("id")
      .eq("establishment_id", estId)
      .eq("is_current", true)
      .single();

    const academicYearId = academicYear?.id || "20262026-2026-2026-2026-202620262026";

    const { data: feeCategory } = await supabase
      .from("fee_categories")
      .select("amount")
      .eq("id", feeCategoryId)
      .single();

    const amount = feeCategory?.amount || amountPaid;

    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        establishment_id: estId,
        student_id: studentId,
        fee_category_id: feeCategoryId,
        academic_year_id: academicYearId,
        amount,
        amount_paid: amountPaid,
        payment_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0], // immediate due date
        payment_method: paymentMethod || "cash",
        status: amountPaid >= amount ? "paid" : "partial",
        notes: notes || "",
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
