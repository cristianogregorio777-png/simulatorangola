interface HudTagProps {
  children: React.ReactNode;
}

/**
 * Rótulo pequeno em mono, letter-spacing largo, no estilo de uma etiqueta
 * de instrumento/HUD. Usado para textos curtos de contexto (fase do
 * projeto, status do sistema), nunca para conteúdo longo.
 */
export function HudTag({ children }: HudTagProps) {
  return (
    <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-sand-muted">
      {children}
    </span>
  );
}
