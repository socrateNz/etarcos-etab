import { NextResponse } from "next/server";
import {
  getStudentByIdAction,
  updateStudentAction,
  deleteStudentAction,
} from "@/features/students/actions";

// Toutes les opérations passent par les Server Actions, qui vérifient la
// permission (students:view/edit/delete), l'établissement de l'appelant et le
// périmètre parent / élève. Ces routes ne vérifiaient auparavant que la
// connexion : n'importe quel compte pouvait lire, modifier ou supprimer
// n'importe quel élève de n'importe quel établissement.

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
  const res = await getStudentByIdAction(id);
  if (res.error || !res.data) {
    const error = res.error ?? "Élève introuvable.";
    return NextResponse.json({ error }, { status: statusFor(error) });
  }

  const s = res.data;
  return NextResponse.json({
    data: {
      id: s.id,
      student_number: s.student_number,
      name: s.user?.name || "Sans nom",
      classroom_id: s.classroom_id,
      enrollment_date: s.enrollment_date,
      status: s.status,
    },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { name?: unknown; classroom_id?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
  }

  const res = await updateStudentAction(id, {
    ...(typeof body.name === "string" ? { name: body.name } : {}),
    ...(body.classroom_id !== undefined ? { classroom_id: body.classroom_id as string | null } : {}),
    ...(body.status !== undefined ? { status: body.status as never } : {}),
  });

  if (res.error) return NextResponse.json({ error: res.error }, { status: statusFor(res.error) });
  return NextResponse.json({ success: true, data: res.data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await deleteStudentAction(id);
  if (res.error) return NextResponse.json({ error: res.error }, { status: statusFor(res.error) });
  return NextResponse.json({ success: true });
}
