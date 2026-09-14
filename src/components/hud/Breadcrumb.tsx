interface BreadcrumbProps {
  /** Caminho atual na hierarquia geográfica, ex: ["Angola", "Luanda"]. */
  path: string[];
}

/**
 * Mostra a posição atual na hierarquia geográfica
 * (Angola > Província > Município > ...). Nesta fase o caminho é fixo em
 * ["Angola"], mas o componente já está pronto para receber navegação real
 * quando o World Engine permitir selecionar províncias/municípios.
 */
export function Breadcrumb({ path }: BreadcrumbProps) {
  return (
    <div className="pointer-events-none absolute bottom-6 left-6 z-30 sm:bottom-10 sm:left-10">
      <div className="pointer-events-auto flex items-center gap-2 border border-void-line bg-void/60 px-4 py-2 backdrop-blur-sm">
        {path.map((segment, index) => (
          <span key={segment} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-sand-muted/60" aria-hidden="true">
                /
              </span>
            )}
            <span
              className={`font-mono text-[11px] tracking-[0.14em] uppercase ${
                index === path.length - 1 ? "text-ochre" : "text-sand-muted"
              }`}
            >
              {segment}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
