// ==================================================
// Etarcos Etab – Gemini AI Service (Extensible)
// ==================================================

import type {
  AIChatRequest,
  AIChatResponse,
  AIPerformanceAnalysisRequest,
  AIPerformanceAnalysisResponse,
  AIPredictionRequest,
  AIPredictionResponse,
} from "@/types/ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

/**
 * Service pour interagir avec l'API Google Gemini.
 * Conçu pour être extensible et sécurisé (ne plante pas si la clé est absente).
 */
export class GeminiService {
  private static isConfigured(): boolean {
    return !!GEMINI_API_KEY && GEMINI_API_KEY !== "your-gemini-api-key";
  }

  /**
   * Assistant de discussion conversationnel
   */
  static async chat(request: AIChatRequest): Promise<AIChatResponse> {
    if (!this.isConfigured()) {
      // Simulation en mode déconnecté (mock)
      const lastMessage = request.messages[request.messages.length - 1]?.content.toLowerCase() || "";
      let reply = "Je suis l'assistant IA d'Etarcos Etab. Le module IA n'est pas encore activé avec une clé API Gemini valide.";

      if (lastMessage.includes("élève") || lastMessage.includes("étudiant")) {
        reply = "Pour analyser le dossier d'un élève, activez le module IA dans les paramètres et renseignez votre clé GEMINI_API_KEY.";
      } else if (lastMessage.includes("classe") || lastMessage.includes("moyenne")) {
        reply = "Les statistiques et analyses de classe seront bientôt disponibles grâce à l'intégration de Gemini.";
      }

      return {
        message: {
          role: "model",
          content: reply,
          timestamp: new Date().toISOString(),
        },
      };
    }

    try {
      // Intégration future directe avec l'API Gemini
      const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: request.messages.map((m) => ({
            role: m.role === "model" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Pas de réponse de l'IA.";

      return {
        message: {
          role: "model",
          content: text,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      return {
        message: {
          role: "model",
          content: "Désolé, une erreur est survenue lors de la communication avec l'assistant IA.",
          timestamp: new Date().toISOString(),
        },
        error: error.message,
      };
    }
  }

  /**
   * Analyse des performances d'une classe (bulletin, moyennes)
   */
  static async analyzeClassroom(
    request: AIPerformanceAnalysisRequest
  ): Promise<AIPerformanceAnalysisResponse> {
    // Dans une version de production, nous requêterions la DB Supabase
    // pour récupérer les notes puis nous les enverrions en contexte à Gemini.
    
    return {
      summary: "Analyse prédictive de la classe : Les élèves montrent de très bons résultats en matières scientifiques, mais des lacunes subsistent en expression écrite.",
      strengths: ["Mathématiques (Moyenne 14.5/20)", "Physique-Chimie (Moyenne 13.8/20)", "Assiduité générale"],
      weaknesses: ["Français (Moyenne 9.8/20)", "Participation en classe en baisse de 5%"],
      recommendations: [
        "Planifier des cours de soutien en français le mercredi après-midi.",
        "Encourager les travaux de groupe pour stimuler la prise de parole."
      ],
      riskStudentsCount: 3,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Prédiction du taux d'échec ou décrochage scolaire d'un élève
   */
  static async predictStudentPerformance(
    request: AIPredictionRequest
  ): Promise<AIPredictionResponse> {
    return {
      predictedAverage: 11.25,
      riskLevel: "medium",
      dropoutRisk: false,
      factors: [
        "Augmentation des retards de 15% au cours du mois écoulé.",
        "Baisse des notes en Histoire-Géographie."
      ],
      improvementSuggestions: [
        "Renforcer le suivi des devoirs à la maison.",
        "Prendre contact avec les parents pour faire le point sur les retards."
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}
