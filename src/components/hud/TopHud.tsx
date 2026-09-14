"use client";

import { motion } from "framer-motion";

interface TopHudProps {
  path: string[];
  canGoBack: boolean;
  onBack: () => void;
}

/**
 * HUD superior mínima da World Screen.
 *
 * Nesta fase mostramos apenas o caminho geográfico atual e um comando
 * discreto de retorno ao nível anterior. Isso mantém a atenção no mapa
 * e evita o visual de dashboard tradicional.
 */
export function TopHud({ path, canGoBack, onBack }: TopHudProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-6 pt-6 sm:px-10 sm:pt-8">
      <motion.div
        key={path.join(" / ")}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="pointer-events-auto flex max-w-[calc(100vw-8rem)] flex-wrap items-center gap-2 rounded-[8px] border border-void-line bg-void/72 px-3.5 py-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-md"
      >
        {path.map((segment, index) => (
          <span key={`${segment}-${index}`} className="flex items-center gap-3">
            {index > 0 && (
              <span className="text-sand-muted/35" aria-hidden="true">
                /
              </span>
            )}
            <span
              className={`font-mono text-[11px] tracking-[0.12em] uppercase ${
                index === path.length - 1 ? "text-sand" : "text-sand-muted"
              }`}
            >
              {segment}
            </span>
          </span>
        ))}
      </motion.div>

      {canGoBack ? (
        <motion.button
          type="button"
          onClick={onBack}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="pointer-events-auto rounded-[8px] border border-void-line bg-void/72 px-3.5 py-2 font-mono text-[10px] tracking-[0.14em] uppercase text-sand-muted backdrop-blur-md transition-colors duration-300 hover:border-ochre/40 hover:text-sand"
          aria-label="Voltar ao nível anterior"
        >
          Voltar
        </motion.button>
      ) : (
        <span aria-hidden="true" />
      )}
    </div>
  );
}
