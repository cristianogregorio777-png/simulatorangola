# Simulation — Fase 2

Motores lógicos da simulação, 100% desacoplados de React e da UI.

## Estrutura

```
src/lib/simulation/
├── world/                  # World Engine — geografia e perfis regionais
│   ├── registry.ts         # Hierarquia territorial e lookup de zonas
│   ├── modifiers.ts        # calculateLocalOperatingCost, demanda, risco
│   └── index.ts
├── engine/                 # Simulation Engine — tempo, estado, eventos
│   ├── clock.ts            # Ciclo diário/semanal/mensal
│   ├── state.ts            # SimulationState inicial e conversão WorldState
│   ├── economy.ts          # (via deterministic/) variações macro
│   ├── events.ts           # Eventos determinísticos
│   ├── eventBus.ts         # Pub/sub desacoplado
│   ├── tick.ts             # Orquestração de um tick diário
│   ├── agents.ts           # Contratos para agentes de IA
│   └── index.ts            # SimulationEngine
├── deterministic/          # Fórmulas reproducíveis (fallback local)
│   ├── prng.ts
│   └── economy.ts
├── businessLocation.ts     # (Fase 1) draft de localização
└── worldState.ts           # INITIAL_WORLD_STATE derivado do motor
```

## Dados territoriais

```
src/data/
├── country.mock.ts
├── provinces.mock.ts       # 18 províncias (existente, mantido)
├── municipalities.mock.ts  # Luanda detalhada + capitais provinciais
└── neighborhoods.mock.ts   # Bairros/zonas + perfis socioeconómicos
```

## Teste CLI

```bash
npm run test:simulation
```

Simula 30 ticks diários e imprime estado, métricas e eventos.

## Fase 3 (`src/core/`)

```
src/core/
├── economy/          # Macro angolana + modificadores
├── business/         # DRE, demanda, fixtures de teste
├── agents/           # Market, Customer, Competitor, Event + fallback/IA
└── simulation/       # tickPhase3 (pipeline oficial do motor)
```

Teste CLI Fase 3:

```bash
npm run test:phase3
```

API servidor (agentes + `completeWithFallback`):

`POST /api/simulation/agents`
