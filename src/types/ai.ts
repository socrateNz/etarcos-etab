// ==================================================
// Etarcos Etab – Gemini AI Types
// ==================================================

export interface AIChatMessage {
  role: "user" | "model" | "system";
  content: string;
  timestamp: string;
}

export interface AIChatRequest {
  messages: AIChatMessage[];
  context?: {
    studentId?: string;
    classroomId?: string;
    establishmentId?: string;
  };
}

export interface AIChatResponse {
  message: AIChatMessage;
  tokensUsed?: number;
  /** false quand aucune clé Gemini n'est configurée (réponse de repli, pas une vraie réponse IA). */
  configured: boolean;
  error?: string;
}
