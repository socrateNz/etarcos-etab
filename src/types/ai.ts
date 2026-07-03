// ==================================================
// Etarcos Etab – Gemini AI Types
// ==================================================

export type AIServiceType = "analysis" | "prediction" | "report" | "chat";

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
  error?: string;
}

export interface AIPerformanceAnalysisRequest {
  classroomId: string;
  academicYearId: string;
  period: string; // T1, T2, etc.
}

export interface AIPerformanceAnalysisResponse {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  riskStudentsCount: number;
  generatedAt: string;
}

export interface AIPredictionRequest {
  studentId: string;
  academicYearId: string;
}

export interface AIPredictionResponse {
  predictedAverage: number;
  riskLevel: "low" | "medium" | "high";
  dropoutRisk: boolean;
  factors: string[];
  improvementSuggestions: string[];
  generatedAt: string;
}
