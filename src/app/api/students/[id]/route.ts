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
  // Get student by ID
  try {
    const supabase = (await createAdminClient()) as any;
    const { data, error } = await supabase
      .from("students")
      .select("id, student_number, enrollment_date, status, classroom_id, user:users(name)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return NextResponse.json({
      data: {
        id: data.id,
        student_number: data.student_number,
        name: data.user?.name || "Sans nom",
        classroom_id: data.classroom_id,
        enrollment_date: data.enrollment_date,
        status: data.status,
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
    const { name, classroom_id, status } = body;

    const supabase = (await createAdminClient()) as any;
    
    // 1. Fetch student to get user_id
    const { data: student } = await supabase
      .from("students")
      .select("user_id")
      .eq("id", id)
      .single();

    if (student?.user_id) {
      // Update user name
      await supabase
        .from("users")
        .update({ name } as any)
        .eq("id", student.user_id);
    }

    // 2. Update student fields
    const { data, error } = await supabase
      .from("students")
      .update({ classroom_id, status } as any)
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
      .from("students")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
