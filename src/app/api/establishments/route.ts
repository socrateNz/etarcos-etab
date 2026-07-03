import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import {
  listEstablishments,
  createEstablishmentAction,
} from "@/features/establishments/actions";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;

  const response = await listEstablishments({ search, per_page: 100 });
  if (response.error) {
    return NextResponse.json({ error: response.error }, { status: 500 });
  }

  return NextResponse.json(response.data?.data ?? []);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const response = await createEstablishmentAction(body);

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: response.data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Format JSON invalide" }, { status: 400 });
  }
}
