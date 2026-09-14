import type { Metadata } from "next";

// Fontes auto-hospedadas via @fontsource (não dependem de acesso externo a
// fonts.googleapis.com em tempo de build, o que torna o build mais
// confiável em ambientes de CI/rede restrita).
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { AppStateProvider } from "@/components/providers/AppStateProvider";

export const metadata: Metadata = {
  title: "Simulador de Negócios Angolano",
  description:
    "Uma plataforma de simulação empresarial ambientada em Angola: estratégia, economia dinâmica e um mundo para explorar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-AO" className="h-full">
      <body className="h-full bg-void text-sand antialiased">
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
