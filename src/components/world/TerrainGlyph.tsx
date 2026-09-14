"use client";

import { motion } from "framer-motion";

/**
 * Elemento de assinatura visual da landing page: um glifo topográfico
 * abstrato, feito de linhas de contorno concêntricas que respiram
 * lentamente. Não representa dados geográficos reais nem o contorno
 * preciso de Angola — é um ornamento cinematográfico que evoca leitura
 * de radar/satélite, coerente com a ideia de "entrar num mundo simulado".
 *
 * Fica atrás do título da landing page, em baixa opacidade.
 */
export function TerrainGlyph() {
  const rings = [
    "M 60 220 Q 140 120 260 150 Q 380 180 420 100 Q 460 30 380 20",
    "M 40 250 Q 150 160 270 190 Q 390 220 440 130 Q 480 50 400 30",
    "M 20 280 Q 160 200 280 230 Q 400 260 460 160 Q 500 70 420 40",
    "M 0 310 Q 170 240 290 270 Q 410 300 480 190 Q 520 90 440 50",
  ];

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 560 360"
      className="pointer-events-none absolute inset-0 mx-auto h-full w-full max-w-4xl opacity-[0.35]"
      fill="none"
    >
      {rings.map((d, index) => (
        <motion.path
          key={d}
          d={d}
          stroke="var(--color-ochre)"
          strokeWidth={0.75}
          strokeOpacity={0.5 - index * 0.08}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 2.4,
            delay: index * 0.25,
            ease: "easeInOut",
          }}
        />
      ))}
      <motion.circle
        cx={430}
        cy={70}
        r={2.5}
        fill="var(--color-ochre)"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.6] }}
        transition={{ duration: 2, delay: 1.4, ease: "easeOut" }}
      />
    </svg>
  );
}
