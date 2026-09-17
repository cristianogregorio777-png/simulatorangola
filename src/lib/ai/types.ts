export type AiProviderId = "gemini" | "groq";

export type AiResponseProvider = AiProviderId | "deterministic";

export interface AiCompletionRequest {
  prompt: string;
  /** Contexto opcional da simulação (estado do mundo, do negócio, etc.). */
  context?: Record<string, unknown>;
}

export interface AiCompletionResponse {
  text: string;
  provider: AiResponseProvider;
}

/** Interface que todo provider de IA deve implementar. */
export interface AiProvider {
  id: AiProviderId;
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}
