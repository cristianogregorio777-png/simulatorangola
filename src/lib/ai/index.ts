import "server-only";
import type { AiProvider, AiProviderId } from "@/lib/ai/types";
import { geminiProvider } from "@/lib/ai/providers/gemini";
import { groqProvider } from "@/lib/ai/providers/groq";

/**
 * Registro central de providers de IA.
 *
 * Futuramente, o Event Engine e os AI Agents vão pedir um provider por id
 * (`getAiProvider("gemini")`) em vez de importar um provider específico
 * diretamente, o que permite trocar/adicionar providers sem alterar quem
 * os consome.
 */
const providers: Record<AiProviderId, AiProvider> = {
  gemini: geminiProvider,
  groq: groqProvider,
};

export function getAiProvider(id: AiProviderId): AiProvider {
  return providers[id];
}

export type { AiProvider, AiProviderId } from "@/lib/ai/types";
export type { AiCompletionRequest, AiCompletionResponse } from "@/lib/ai/types";
