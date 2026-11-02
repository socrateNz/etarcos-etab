// ==================================================
// Etarcos Etab – Gemini AI Service
// ==================================================

import * as Sentry from "@sentry/nextjs";
import type { AIChatMessage, AIChatRequest, AIChatResponse } from "@/types/ai";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash";

/** Garde-fous sur l'historique envoyé à l'API (coût + taille de requête). */
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

const SYSTEM_INSTRUCTION =
  "Tu es l'assistant d'Etarcos Etab, une plateforme de gestion d'établissements scolaires. " +
  "Réponds en français, de façon concise et professionnelle. " +
  "IMPORTANT : tu n'as AUCUN accès aux données de l'établissement (élèves, notes, paiements, classes). " +
  "N'invente jamais de noms, de notes, de moyennes ou de statistiques. Si on te demande d'analyser " +
  "des données réelles, explique que tu ne peux pas les consulter et propose une aide générale " +
  "(méthode, modèle de rapport, conseils pédagogiques) ou invite l'utilisateur à coller les chiffres.";

function getApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "your-gemini-api-key") return null;
  return key;
}

function reply(content: string, configured: boolean, error?: string): AIChatResponse {
  return {
    message: { role: "model", content, timestamp: new Date().toISOString() },
    configured,
    ...(error ? { error } : {}),
  };
}

/** Nettoie l'historique reçu du client : rôles valides, longueur bornée, N derniers messages. */
export function sanitizeHistory(messages: unknown): Pick<AIChatMessage, "role" | "content">[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m): m is { role: string; content: string } =>
        !!m && typeof m === "object" && typeof m.content === "string" && m.content.trim() !== ""
    )
    .map((m) => ({
      role: m.role === "model" ? ("model" as const) : ("user" as const),
      content: m.content.slice(0, MAX_MESSAGE_LENGTH),
    }))
    .slice(-MAX_HISTORY_MESSAGES);
}

/**
 * Service d'interaction avec l'API Google Gemini.
 *
 * Seul le chat généraliste est implémenté. Il n'y a volontairement PAS
 * d'analyse de classe ni de prédiction par élève : tant qu'elles ne
 * s'appuient pas sur les vraies données de l'établissement, elles ne
 * produiraient que des chiffres inventés.
 */
export class GeminiService {
  static isConfigured(): boolean {
    return getApiKey() !== null;
  }

  static async chat(request: AIChatRequest): Promise<AIChatResponse> {
    const apiKey = getApiKey();
    if (!apiKey) {
      return reply(
        "L'assistant IA n'est pas encore activé sur cette installation (clé GEMINI_API_KEY absente). " +
          "Contactez l'administrateur de la plateforme.",
        false
      );
    }

    const history = sanitizeHistory(request.messages);
    if (history.length === 0 || history[history.length - 1].role !== "user") {
      return reply("Aucune question à traiter.", true, "empty_history");
    }

    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

    try {
      const response = await fetch(`${API_BASE}/${model}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: history.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        throw new Error(`Gemini API ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;

      return reply(text || "Pas de réponse de l'IA.", true);
    } catch (error) {
      Sentry.captureException(error, { tags: { service: "gemini" } });
      console.error("[ai] Erreur Gemini:", error);
      return reply(
        "Désolé, une erreur est survenue lors de la communication avec l'assistant IA.",
        true,
        "upstream_error"
      );
    }
  }
}
