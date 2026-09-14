"use client";

import { motion } from "framer-motion";
import { EnterButton } from "@/components/ui/EnterButton";
import { HudTag } from "@/components/ui/HudTag";

interface LandingScreenProps {
  onEnter: () => void;
}

/**
 * Tela de entrada do simulador. Composição centrada, muito espaço
 * negativo, com o glifo topográfico como elemento ambiente atrás do
 * título. O botão "ENTRAR NO MUNDO" dispara a transição controlada por
 * `page.tsx` — nenhuma navegação de página ocorre aqui.
 */
export function LandingScreen({ onEnter }: LandingScreenProps) {
  return (
    <motion.main
      exit={{ opacity: 0, scale: 1.08, filter: "blur(6px)" }}
      transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
      className="relative flex h-full min-h-screen w-full flex-col justify-between overflow-hidden bg-void px-6 py-8 sm:px-10"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,_#0b0d0f_0%,_#080a0b_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:72px_72px]"
      />

      <div className="relative flex items-center justify-between gap-4">
        <HudTag>Simulação empresarial Angola</HudTag>
        <HudTag>Mapa económico</HudTag>
      </div>

      <div className="relative grid w-full flex-1 content-center gap-12 py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,0.48fr)] lg:items-end">
        <section className="max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="font-display text-[3rem] leading-[0.95] font-medium text-sand sm:text-7xl md:text-8xl"
        >
          Simulador de negócios para Angola
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-8 max-w-xl font-body text-base leading-7 text-sand-muted sm:text-lg"
        >
          Escolha uma localização, leia o território e teste decisões de
          mercado com uma base geográfica mais séria.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.95 }}
          className="mt-12 flex flex-col items-start gap-3"
        >
          <EnterButton label="Abrir mapa" onClick={onEnter} />
          <span className="font-mono text-[11px] tracking-[0.14em] text-sand-muted/70">
            Luanda 8°50&apos;S, 13°14&apos;E
          </span>
        </motion.div>
        </section>

        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="border-l border-void-line pl-5 text-sm leading-7 text-sand-muted"
        >
          <p className="text-sand">Fase inicial</p>
          <p>Seleção territorial, leitura de província e entrada na simulação.</p>
        </motion.aside>
      </div>
    </motion.main>
  );
}
