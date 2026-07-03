import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveEstablishmentId } from "@/lib/auth/active-etab";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  // Get students list
  try {
    const supabase = (await createAdminClient()) as any;
    const estId = (await resolveEstablishmentId(
      session.user.establishment_id,
      searchParams.get("establishment_id") || undefined
    )) || "00000000-0000-0000-0000-000000000000";

    let query = supabase
      .from("students")
      .select("id, student_number, enrollment_date, status, user:users(name), classroom:classrooms(name)")
      .eq("establishment_id", estId);

    if (search) {
      // Simplistic search constraint
      query = query.ilike("student_number", `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Format structure
    const list = data.map((s: any) => ({
      id: s.id,
      student_number: s.student_number,
      name: s.user?.name || "Sans nom",
      class: s.classroom?.name || "Sans classe",
      enrollment_date: s.enrollment_date,
      status: s.status,
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
    const { name, classId, studentNumber } = body;

    if (!name || !studentNumber) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const supabase = (await createAdminClient()) as any;
    const estId = (await resolveEstablishmentId(
      session.user.establishment_id,
      body.establishment_id
    )) || "00000000-0000-0000-0000-000000000000";

    // 1. Create Supabase Auth user record (simplistic simulation)
    // Normally, this involves Edge functions or Admin SDK. Let's create user profile directly.
    const { data: newUserProfile, error: profileError } = await supabase
      .from("users")
      .insert({
        email: `${studentNumber.toLowerCase()}@etarcos-etab.com`,
        name,
        establishment_id: estId,
        is_active: true,
      } as any)
      .select()
      .single();

    if (profileError) throw profileError;

    const newUserId = (newUserProfile as any)?.id;

    // 2. Insert Student
    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert({
        establishment_id: estId,
        user_id: newUserId,
        student_number: studentNumber,
        classroom_id: classId || null,
        academic_year_id: "20262026-2026-2026-2026-202620262026", // should fetch current active year
        status: "active",
      } as any)
      .select()
      .single();

    if (studentError) throw studentError;

    return NextResponse.json({ success: true, data: student }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
