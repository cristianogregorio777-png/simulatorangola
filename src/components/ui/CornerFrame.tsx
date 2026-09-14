/**
 * Molduras finas nos quatro cantos da tela, como um "viewfinder" de
 * instrumento óptico. É o elemento estrutural que reforça a sensação de
 * "entrar num sistema/mundo" em vez de "abrir um dashboard".
 *
 * Puramente decorativo (aria-hidden) — não carrega informação.
 */
export function CornerFrame() {
  const cornerBase = "pointer-events-none fixed h-6 w-6 border-ochre/40";

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40">
      <span className={`${cornerBase} top-6 left-6 border-t border-l`} />
      <span className={`${cornerBase} top-6 right-6 border-t border-r`} />
      <span className={`${cornerBase} bottom-6 left-6 border-b border-l`} />
      <span className={`${cornerBase} bottom-6 right-6 border-b border-r`} />
    </div>
  );
}
