import "server-only";
import type { AiCompletionResponse, AiProvider } from "@/lib/ai/types";

export const geminiProvider: AiProvider = {
  id: "gemini",
  async complete(request): Promise<AiCompletionResponse> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não está configurada.");
    }

    const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `És um analista de negócios para um simulador empresarial em Angola. Responde em português, de forma breve e prática.\n\nPedido: ${request.prompt}\n\nContexto: ${JSON.stringify(
                    request.context ?? {},
                  )}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 320,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini falhou com estado ${response.status}.`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    return {
      provider: "gemini",
      text:
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
        "Não foi possível gerar uma resposta.",
    };
  },
};
