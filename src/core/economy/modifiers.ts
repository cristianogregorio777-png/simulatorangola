import type {
  AngolaMacroContext,
  EconomicModifierProposal,
  EconomyIndicators,
  SimulationState,
} from "@/types/simulation";

/** Aplica propostas de agentes ao par economia + macro. */
export function applyEconomicModifiers(
  state: Pick<SimulationState, "economy" | "macro">,
  proposals: EconomicModifierProposal[],
): Pick<SimulationState, "economy" | "macro"> {
  if (proposals.length === 0) {
    return { economy: state.economy, macro: state.macro };
  }

  const economy = { ...state.economy };
  const macro = { ...state.macro };

  for (const proposal of proposals) {
    switch (proposal.target) {
      case "inflation":
      case "gdpGrowth":
      case "interestRate":
        economy[proposal.target] = economy[proposal.target] + proposal.delta;
        break;
      case "exchangeRateUsdAoa":
        economy.exchangeRateUsdAoa = Math.max(
          400,
          economy.exchangeRateUsdAoa + proposal.delta,
        );
        break;
      case "basketCostAoa":
        macro.basketCostAoa = Math.max(80_000, macro.basketCostAoa + proposal.delta);
        break;
      case "forexScarcityIndex":
        macro.forexScarcityIndex = clamp01(macro.forexScarcityIndex + proposal.delta);
        break;
      case "customsDelayDays":
        macro.customsDelayDays = Math.max(1, macro.customsDelayDays + proposal.delta);
        break;
      case "generatorFuelCostMultiplier":
        macro.generatorFuelCostMultiplier = Math.max(
          1,
          macro.generatorFuelCostMultiplier + proposal.delta,
        );
        break;
      default: {
        const _exhaustive: never = proposal.target;
        void _exhaustive;
      }
    }
  }

  return { economy, macro };
}

/** Sincroniza choques macro com indicadores headline quando relevante. */
export function mergeEconomyAndMacro(
  economy: EconomyIndicators,
  macro: AngolaMacroContext,
): EconomyIndicators {
  const inflationFromBasket =
    (macro.basketCostAoa / 285_000 - 1) * 0.015 + macro.forexScarcityIndex * 0.004;

  return {
    ...economy,
    inflation: round6(
      Math.max(0.05, Math.min(0.45, economy.inflation + inflationFromBasket * 0.02)),
    ),
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
