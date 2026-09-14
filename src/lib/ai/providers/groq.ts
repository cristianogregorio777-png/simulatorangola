import "server-only";
import type { AiCompletionResponse, AiProvider } from "@/lib/ai/types";

export const groqProvider: AiProvider = {
  id: "groq",
  async complete(request): Promise<AiCompletionResponse> {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error("GROQ_API_KEY não está configurada.");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "És um analista de negócios para um simulador empresarial em Angola. Responde em português, de forma breve, prática e sem floreio.",
          },
          {
            role: "user",
            content: `${request.prompt}\n\nContexto:\n${JSON.stringify(
              request.context ?? {},
            )}`,
          },
        ],
        temperature: 0.4,
        max_tokens: 320,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq falhou com estado ${response.status}.`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return {
      provider: "groq",
      text:
        data.choices?.[0]?.message?.content?.trim() ??
        "Não foi possível gerar uma resposta.",
    };
  },
};
