"use client";

interface EnterButtonProps {
  label: string;
  onClick: () => void;
}

/**
 * CTA principal da landing page. Deliberadamente sem preenchimento sólido
 * nem sombras pesadas — apenas uma borda fina que ganha um brilho dourado
 * sutil no hover, e a seta desliza para a direita. O objetivo é que o
 * botão pareça um controlo de instrumento, não um botão de formulário.
 */
export function EnterButton({ label, onClick }: EnterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative inline-flex items-center gap-4 rounded-[8px] border border-sand/20 bg-sand/5 px-6 py-3.5 font-mono text-xs tracking-[0.14em] uppercase text-sand transition-colors duration-300 hover:border-ochre/70 hover:bg-sand/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ochre"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 rounded-[8px] bg-ochre/0 transition-colors duration-300 group-hover:bg-ochre/[0.06]"
      />
      {label}
      <span
        aria-hidden="true"
        className="text-ochre transition-transform duration-300 ease-out group-hover:translate-x-1"
      >
        &rarr;
      </span>
    </button>
  );
}
