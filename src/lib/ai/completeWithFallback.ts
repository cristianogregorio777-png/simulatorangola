import "server-only";

import { getAiProvider } from "@/lib/ai";
import { completeDeterministic } from "@/lib/ai/providers/deterministic";
import type { AiCompletionRequest, AiCompletionResponse } from "@/lib/ai/types";

const FALLBACK_ORDER = ["groq", "gemini"] as const;

/**
 * Camada central de IA com fallback:
 * Groq → Gemini → lógica determinística.
 *
 * Nunca chamar de componentes React — usar apenas em rotas/API de servidor.
 */
export async function completeWithFallback(
  request: AiCompletionRequest,
): Promise<AiCompletionResponse> {
  for (const providerId of FALLBACK_ORDER) {
    try {
      return await getAiProvider(providerId).complete(request);
    } catch {
      // Tenta o próximo provider sem expor detalhes sensíveis nos logs.
    }
  }

  return completeDeterministic(request);
}
