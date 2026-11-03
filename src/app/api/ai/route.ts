import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { GeminiService } from "@/services/ai";
import type { AIChatRequest } from "@/types/ai";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Check user permissions for AI
  const hasAIPermission = session.user.permissions.includes("ai_assistant:view");
  if (!hasAIPermission && session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Habilitation insuffisante pour utiliser l'IA" }, { status: 403 });
  }

  const { allowed } = await checkRateLimit("ai", session.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite d'utilisation de l'assistant atteinte. Réessayez dans une heure." },
      { status: 429 }
    );
  }

  let body: { action?: unknown; payload?: { messages?: unknown } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format de requête invalide" }, { status: 400 });
  }

  switch (body.action) {
    case "chat": {
      if (!Array.isArray(body.payload?.messages)) {
        return NextResponse.json({ error: "Historique des messages requis" }, { status: 400 });
      }
      // Contenu non fiable (client) : nettoyé par sanitizeHistory dans le service.
      const res = await GeminiService.chat({ messages: body.payload.messages as AIChatRequest["messages"] });
      // Le détail technique de l'erreur reste côté serveur (logs + Sentry).
      return NextResponse.json({ message: res.message, configured: res.configured });
    }

    default:
      return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }
}
