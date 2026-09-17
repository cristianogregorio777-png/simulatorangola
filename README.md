# Simulador de Negócios Angolano

Plataforma de simulação empresarial ambientada em Angola. Este repositório
contém a **Fase 1**: a fundação visual e técnica do projeto.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4
- Three.js (camada 3D ambiente, preparada para expansão)
- MapLibre GL JS (mapa placeholder de Angola)
- Supabase (Auth e SSR preparados para a área protegida)

## Como executar

```bash
npm install
cp .env.example .env.local   # depois preencha com suas credenciais reais
npm run dev
```

Abra http://localhost:3000.

Scripts disponíveis:

```bash
npm run dev      # ambiente de desenvolvimento
npm run build    # build de produção
npm run start    # servir o build de produção
npm run lint     # eslint
npx tsc --noEmit # verificação de tipos
```

## Estrutura

```
src/
  app/                 rotas Next.js (App Router)
  components/
    ui/                elementos de interface reutilizáveis (botão, HUD tags, moldura)
    world/             telas e elementos do "mundo" (landing, world screen, glifo, campo ambiente 3D)
    map/               integração MapLibre
    hud/               elementos de HUD (relógio, indicadores, breadcrumb)
  lib/
    map/               configuração do MapLibre
    data/               camada de acesso a dados (hoje mockados, futuramente Supabase)
    simulation/        estado inicial do mundo simulado
    ai/                contratos e providers de IA (Gemini, Groq) — ainda sem chamadas reais
    supabase/          clientes Supabase (browser e servidor)
  types/               tipos TypeScript (geografia, simulação)
  data/                dados mockados (províncias, municípios)
```

Esta arquitetura foi pensada para permitir adicionar, em fases futuras, o
Simulation Engine, Economy Engine, Business Engine, Customer Engine,
Competitor Engine, Event Engine e os AI Agents sem precisar refazer o
projeto.

## Variáveis de ambiente

Veja `.env.example`. Nenhuma chave é usada diretamente no código. As
variáveis necessárias nesta fase são:

- `NEXT_PUBLIC_SUPABASE_URL` (sem `/rest/v1/`)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (apenas servidor)
- `NEXT_PUBLIC_MAPTILER_API_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY` (apenas servidor)
- `GEMINI_API_KEY` (apenas servidor)
- `GROQ_API_KEY` (apenas servidor)
- `NEXT_PUBLIC_MAP_STYLE_URL` (opcional; o mapa tem base local sem tiles externos)

As chaves públicas podem ser lidas no browser. As chaves privadas só devem
ser usadas em código de servidor. Configure-as no painel do Netlify/Vercel —
nunca as commite no repositório.

## Rotas

- `/` - landing e World Screen
- `/simulacao` - área protegida da primeira simulação

## Próximo passo recomendado

Construir o **World Engine**: navegação real entre Angola → Província →
Município → Comuna/Distrito, e conectar o mapa MapLibre a dados geográficos
reais para Luanda e, depois, para as restantes províncias.
