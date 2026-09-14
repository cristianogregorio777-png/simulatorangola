# Simulation

Esta pasta concentra a lógica de simulação do jogo. Nesta fase (Fase 1)
contém apenas `worldState.ts`, com um estado inicial estático usado pela
World Screen.

Engines planejados para as próximas fases (cada um em seu próprio
subdiretório, ex: `lib/simulation/economy/`):

- **Economy Engine** — inflação, câmbio, crescimento, ciclos de mercado.
- **Business Engine** — criação, operação e crescimento de negócios.
- **Customer Engine** — comportamento e demanda dos clientes simulados.
- **Competitor Engine** — negócios concorrentes controlados por IA.
- **Event Engine** — eventos aleatórios/narrativos que afetam o mundo.

A ideia é que cada engine exponha funções puras que recebem o
`WorldState` atual e retornam um novo estado, para manter a simulação
previsível e testável.
