import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { GeminiService } from "@/services/ai";

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

  try {
    const body = await req.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: "Action manquante dans la requête" }, { status: 400 });
    }

    switch (action) {
      case "chat":
        if (!payload?.messages) {
          return NextResponse.json({ error: "Historique des messages requis" }, { status: 400 });
        }
        const chatResponse = await GeminiService.chat(payload);
        return NextResponse.json(chatResponse);

      case "analyze_classroom":
        if (!payload?.classroomId || !payload?.academicYearId || !payload?.period) {
          return NextResponse.json({ error: "Paramètres de classe manquants" }, { status: 400 });
        }
        const classroomResponse = await GeminiService.analyzeClassroom(payload);
        return NextResponse.json(classroomResponse);

      case "predict_student":
        if (!payload?.studentId || !payload?.academicYearId) {
          return NextResponse.json({ error: "Identifiant élève manquant" }, { status: 400 });
        }
        const predictionResponse = await GeminiService.predictStudentPerformance(payload);
        return NextResponse.json(predictionResponse);

      default:
        return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: "Format de requête invalide" }, { status: 400 });
  }
}
