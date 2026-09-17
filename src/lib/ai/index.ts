import "server-only";
import type { AiProvider, AiProviderId } from "@/lib/ai/types";
import { geminiProvider } from "@/lib/ai/providers/gemini";
import { groqProvider } from "@/lib/ai/providers/groq";

/**
 * Registro central de providers de IA.
 *
 * Consumidores devem preferir `completeWithFallback()` em vez de chamar
 * providers diretamente, para respeitar a cadeia Groq → Gemini → determinístico.
 */
const providers: Record<AiProviderId, AiProvider> = {
  gemini: geminiProvider,
  groq: groqProvider,
};

export function getAiProvider(id: AiProviderId): AiProvider {
  return providers[id];
}

export { completeWithFallback } from "@/lib/ai/completeWithFallback";
export type { AiProvider, AiProviderId, AiResponseProvider } from "@/lib/ai/types";
export type { AiCompletionRequest, AiCompletionResponse } from "@/lib/ai/types";
