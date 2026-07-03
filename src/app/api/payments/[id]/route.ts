import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  // Get payment receipt by ID
  try {
    const supabase = (await createAdminClient()) as any;
    const { data, error } = await supabase
      .from("payments")
      .select("id, amount, amount_paid, payment_date, payment_method, status, notes, student:students(user:users(name)), fee_category:fee_categories(name)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return NextResponse.json({
      data: {
        id: data.id,
        student: data.student?.user?.name || "Élève inconnu",
        fee: data.fee_category?.name || "Frais scolaires",
        amount: Number(data.amount || 0),
        amount_paid: Number(data.amount_paid || 0),
        date: data.payment_date || data.created_at.split('T')[0],
        method: data.payment_method || "cash",
        status: data.status,
        notes: data.notes,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const { amount_paid, payment_method, notes, status } = body;

    const supabase = (await createAdminClient()) as any;
    const { data, error } = await supabase
      .from("payments")
      .update({ amount_paid, payment_method, notes, status } as any)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const supabase = (await createAdminClient()) as any;
    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
