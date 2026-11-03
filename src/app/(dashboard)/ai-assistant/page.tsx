"use client";

import { useState } from "react";
import { Sparkles, Send, User, Bot, Loader2, Info } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "Bonjour ! Je suis l'assistant IA d'Etarcos Etab. Je peux vous aider à rédiger des rapports, des courriers aux parents ou des appréciations, et répondre à vos questions pédagogiques. Je n'ai pas accès aux données de votre établissement : collez les chiffres utiles dans votre message si besoin." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(true);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          payload: {
            messages: [...messages, userMessage]
          }
        }),
      });

      const data = await response.json();
      if (typeof data.configured === "boolean") setConfigured(data.configured);
      const content: string | undefined = data.message?.content;
      if (content) {
        setMessages(prev => [...prev, { role: "model", content }]);
      } else {
        const reason = typeof data.error === "string" ? data.error : "Désolé, je n'ai pas pu générer de réponse pour le moment.";
        setMessages(prev => [...prev, { role: "model", content: reason }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "Erreur de connexion avec le service d'intelligence artificielle." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Rédiger un modèle de rapport de fin de trimestre pour une classe",
    "Proposer un courrier aux parents pour signaler des retards répétés",
    "Donner des conseils pour accompagner les élèves en difficulté",
  ];

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
      <PageHeader
        title="Assistant Etarcos AI"
        description="Rédaction de rapports, courriers et conseils pédagogiques assistés par IA."
        icon={Sparkles}
      />

      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          {configured
            ? "Fonctionnalité en bêta. L'assistant n'a pas accès aux données de l'établissement et peut se tromper : vérifiez toujours ses réponses."
            : "L'assistant IA n'est pas activé sur cette installation. Contactez l'administrateur de la plateforme."}
        </p>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m, index) => (
            <div key={index} className={`flex gap-3 max-w-[80%] ${m.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-brand-500/20 text-brand-400" : "bg-cyan-500/20 text-cyan-400"
                }`}>
                {m.role === "user" ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
              </div>
              <div className={`p-3.5 rounded-xl text-sm leading-relaxed border ${m.role === "user"
                  ? "bg-brand-500/10 border-brand-500/20 text-foreground rounded-tr-none"
                  : "bg-background border-border text-foreground rounded-tl-none"
                }`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              </div>
              <div className="p-3.5 bg-background border border-border rounded-xl text-sm text-muted-foreground rounded-tl-none">
                Rédaction en cours...
              </div>
            </div>
          )}
        </div>

        {/* Suggestions chips */}
        {messages.length === 1 && (
          <div className="px-4 py-2 border-t border-border bg-muted/10">
            <p className="text-xs text-muted-foreground font-semibold mb-2">Suggestions rapides :</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-left text-muted-foreground hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-background/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question à l'IA d'Etarcos..."
              className="bg-background border-border flex-1"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-brand-500 hover:bg-brand-600 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
