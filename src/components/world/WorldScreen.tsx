"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TopHud } from "@/components/hud/TopHud";
import { LocationPanel } from "@/components/world/LocationPanel";
import { useAppState } from "@/components/providers/AppStateProvider";
import { WORLD_PROVINCES } from "@/data/world-map.mock";
import { MOCK_MUNICIPALITIES } from "@/data/municipalities.mock";

/**
 * MapLibre e Three.js dependem do DOM/WebGL do browser, por isso ambos
 * são carregados apenas no cliente (`ssr: false`) e de forma preguiçosa,
 * para não penalizar o carregamento inicial da landing page.
 */
const MapView = dynamic(
  () => import("@/components/map/MapView").then((mod) => mod.MapView),
  { ssr: false },
);

const provinceById = new Map(
  WORLD_PROVINCES.map(({ province }) => [province.id, province] as const),
);

const municipalityById = new Map(
  MOCK_MUNICIPALITIES.map((municipality) => [
    municipality.id,
    municipality,
  ] as const),
);

/**
 * Ambiente principal do simulador.
 *
 * O mapa continua sendo o protagonista absoluto. Agora, porém, a
 * navegação geográfica desemboca numa seleção mínima de localização que
 * fica persistida no estado compartilhado para a etapa protegida.
 */
export function WorldScreen() {
  const router = useRouter();
  const {
    selectedProvinceId,
    selectedMunicipalityId,
    selectProvince,
    selectMunicipality,
    resetSelection,
  } = useAppState();

  const province = selectedProvinceId
    ? provinceById.get(selectedProvinceId) ?? null
    : null;
  const municipality = selectedMunicipalityId
    ? municipalityById.get(selectedMunicipalityId) ?? null
    : null;

  const path = province
    ? municipality
      ? ["ANGOLA", province.name.toUpperCase(), municipality.name.toUpperCase()]
      : ["ANGOLA", province.name.toUpperCase()]
    : ["ANGOLA"];

  const handleProvinceSelect = (provinceId: string) => {
    selectProvince(provinceId);
  };

  const handleMunicipalitySelect = (municipalityId: string | null) => {
    selectMunicipality(municipalityId);
  };

  const handleBack = () => {
    if (municipality) {
      selectMunicipality(null);
      return;
    }

    if (province) {
      resetSelection();
    }
  };

  const handleStartSimulation = () => {
    router.push("/simulacao");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-screen w-full overflow-hidden bg-void"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(8,10,11,0.58)_0%,_rgba(8,10,11,0.18)_42%,_rgba(8,10,11,0.78)_100%)]"
      />

      <MapView
        activeProvinceId={selectedProvinceId}
        activeMunicipalityId={selectedMunicipalityId}
        onProvinceSelect={handleProvinceSelect}
        onMunicipalitySelect={handleMunicipalitySelect}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,_rgba(8,10,11,0.72)_0%,_transparent_32%,_transparent_64%,_rgba(8,10,11,0.45)_100%)]"
      />

      <TopHud path={path} canGoBack={Boolean(province)} onBack={handleBack} />
      <LocationPanel onStartSimulation={handleStartSimulation} />
    </motion.div>
  );
}
