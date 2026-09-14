/**
 * Contratos para os futuros providers de IA (Gemini, Groq, etc.).
 *
 * Nesta fase NENHUMA chamada de IA é feita. Este arquivo apenas define a
 * interface comum que os providers implementarão futuramente, para que
 * o resto da aplicação (ex: Event Engine, AI Agents) possa depender de
 * uma abstração e não de um provider específico.
 */

export type AiProviderId = "gemini" | "groq";

export interface AiCompletionRequest {
  prompt: string;
  /** Contexto opcional da simulação (estado do mundo, do negócio, etc.). */
  context?: Record<string, unknown>;
}

export interface AiCompletionResponse {
  text: string;
  provider: AiProviderId;
}

/** Interface que todo provider de IA deve implementar. */
export interface AiProvider {
  id: AiProviderId;
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}
