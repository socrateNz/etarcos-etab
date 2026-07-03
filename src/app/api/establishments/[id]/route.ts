import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import {
  getEstablishmentById,
  updateEstablishmentAction,
  deleteEstablishmentAction,
} from "@/features/establishments/actions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const response = await getEstablishmentById(id);

  if (response.error) {
    return NextResponse.json({ error: response.error }, { status: 404 });
  }

  return NextResponse.json({ data: response.data });
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
    const response = await updateEstablishmentAction(id, body);

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: response.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const response = await deleteEstablishmentAction(id);

  if (response.error) {
    return NextResponse.json({ error: response.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
