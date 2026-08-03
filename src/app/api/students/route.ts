import { NextResponse } from "next/server";
import { listStudents, createStudentAction } from "@/features/students/actions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const res = await listStudents({
    search: searchParams.get("search") || undefined,
    establishment_id: searchParams.get("establishment_id") || undefined,
  });

  if (res.error) {
    const status = res.error === "Non autorisé." || res.error === "Permission refusée." ? 403 : 500;
    return NextResponse.json({ error: res.error }, { status });
  }

  const list = res.data!.data.map((s) => ({
    id: s.id,
    student_number: s.student_number,
    name: s.user?.name || "Sans nom",
    class: s.classroom?.name || "Sans classe",
    enrollment_date: s.enrollment_date,
    status: s.status,
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

  const res = await createStudentAction({
    name: body.name,
    student_number: body.studentNumber,
    classroom_id: body.classId || null,
    establishment_id: body.establishment_id,
    scholarship_type: "none",
    status: "active",
  });

  if (res.error) {
    const status = res.error === "Non autorisé." || res.error === "Permission refusée." ? 403 : 400;
    return NextResponse.json({ error: res.error }, { status });
  }

  return NextResponse.json({ success: true, data: res.data }, { status: 201 });
}
