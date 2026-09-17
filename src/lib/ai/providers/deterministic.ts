import "server-only";
import type { AiCompletionResponse, AiCompletionRequest } from "@/lib/ai/types";
import { buildDeterministicInsightContext } from "@/lib/simulation/deterministic/economy";
import type { EconomyIndicators } from "@/types/simulation";

/**
 * Fallback determinístico quando Groq e Gemini não estão disponíveis.
 * Gera recomendações simples com base no contexto da simulação.
 */
export function completeDeterministic(
  request: AiCompletionRequest,
): AiCompletionResponse {
  const rawContext = request.context ?? {};
  const zoneLabel = String(
    rawContext.province ?? rawContext.provinceName ?? "Angola",
  );

  const context =
    rawContext.inflation !== undefined &&
    rawContext.exchangeRateUsdAoa !== undefined
      ? buildDeterministicInsightContext(
          rawContext as unknown as EconomyIndicators,
          zoneLabel,
        )
      : buildDeterministicInsightContext(
          {
            inflation: Number(rawContext.inflation ?? 0.152),
            gdpGrowth: Number(rawContext.gdpGrowth ?? 0.028),
            exchangeRateUsdAoa: Number(rawContext.exchangeRateUsdAoa ?? 856),
            interestRate: Number(rawContext.interestRate ?? 0.195),
          },
          zoneLabel,
        );

  const province = String(context.province ?? zoneLabel);
  const cash = Number(context.cash ?? context.cashBalance ?? 0);
  const demand = Number(context.demand ?? 60);

  const cashAdvice =
    cash > 2_000_000
      ? "Mantém reserva de caixa para absorver choques de custo logístico."
      : "Prioriza margem e reduz despesas fixas até estabilizar o fluxo de caixa.";

  const demandAdvice =
    demand >= 70
      ? "Demanda elevada: reforça estoque e capacidade de atendimento."
      : "Demanda moderada: investe em visibilidade local e parcerias de distribuição.";

  const text = [
    `Análise operacional para ${province}.`,
    cashAdvice,
    demandAdvice,
    "Monitoriza concorrência local e ajusta preços semanalmente.",
  ].join(" ");

  return {
    provider: "deterministic",
    text,
  };
}
