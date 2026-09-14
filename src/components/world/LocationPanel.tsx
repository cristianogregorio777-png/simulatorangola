"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { MOCK_MUNICIPALITIES } from "@/data/municipalities.mock";
import { MOCK_PROVINCES } from "@/data/provinces.mock";
import { useAppState } from "@/components/providers/AppStateProvider";

interface LocationPanelProps {
  onStartSimulation: () => void;
}

const provinceById = new Map(
  MOCK_PROVINCES.map((province) => [province.id, province] as const),
);

const municipalityById = new Map(
  MOCK_MUNICIPALITIES.map((municipality) => [
    municipality.id,
    municipality,
  ] as const),
);

/**
 * Painel mínimo de escolha de localização.
 *
 * Nesta fase, Luanda desbloqueia a seleção municipal mockada. O painel
 * evita excesso de informação e atua só como confirmação do ponto
 * escolhido antes de seguir para a área protegida.
 */
export function LocationPanel({ onStartSimulation }: LocationPanelProps) {
  const {
    selectedProvinceId,
    selectedMunicipalityId,
    selectedBusinessLocation,
    hasHydrated,
    selectMunicipality,
    confirmLocation,
  } = useAppState();

  const province = selectedProvinceId
    ? provinceById.get(selectedProvinceId) ?? null
    : null;
  const municipality = selectedMunicipalityId
    ? municipalityById.get(selectedMunicipalityId) ?? null
    : null;

  const isLuanda = province?.slug === "luanda";
  const luandaMunicipalities = useMemo(
    () => MOCK_MUNICIPALITIES.filter((item) => item.provinceId === "prov-luanda"),
    [],
  );

  const handleConfirmLocation = () => {
    confirmLocation();
  };

  return (
    <motion.aside
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="pointer-events-auto absolute right-4 bottom-4 z-30 w-[min(92vw,25rem)] rounded-[8px] border border-void-line bg-void/78 p-4 text-sand shadow-[0_28px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:right-10 sm:bottom-10 sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-sand-muted">
            Localização
          </p>
          <h2 className="mt-1 font-display text-xl font-medium text-sand">
            {selectedBusinessLocation?.name ??
              (province ? province.name : "Seleção pendente")}
          </h2>
        </div>

        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-sand-muted">
          {selectedBusinessLocation ? "Confirmada" : "Preparação"}
        </div>
      </div>

      <div className="space-y-3">
        <Field label="Província" value={province?.name ?? "A selecionar"} />
        <Field
          label="Município"
          value={municipality?.name ?? "A selecionar"}
        />
        <Field
          label="Zona / Área"
          value={
            selectedBusinessLocation?.zoneLabel ??
            municipality?.name ??
            "Pendente de dados reais"
          }
        />
      </div>

      <div className="mt-4 border-t border-void-line pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-sand-muted">
            Nível de detalhe
          </span>
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ochre">
            Dados iniciais
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-5">
          {["Demanda", "Movimento", "Concorrência", "Custo", "Mercado"].map(
            (item) => (
              <div
                key={item}
                className="rounded-[6px] border border-void-line bg-sand/[0.03] px-2 py-2"
              >
                <div className="font-mono tracking-[0.1em] uppercase text-sand-muted">
                  {item}
                </div>
                <div className="mt-1 font-mono text-sand">—</div>
              </div>
            ),
          )}
        </div>
      </div>

      {!hasHydrated ? (
        <div className="mt-4 font-mono text-[10px] tracking-[0.12em] uppercase text-sand-muted">
          A preparar estado...
        </div>
      ) : (
        <>
          {isLuanda ? (
            <div className="mt-4">
              <p className="mb-2 font-mono text-[10px] tracking-[0.12em] uppercase text-sand-muted">
                Seleciona um ponto
              </p>
              <div className="flex flex-wrap gap-2">
                {luandaMunicipalities.map((item) => {
                  const isActive = item.id === selectedMunicipalityId;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectMunicipality(item.id)}
                      className={`rounded-[6px] border px-3 py-2 font-mono text-[10px] tracking-[0.1em] uppercase transition-colors duration-300 ${
                        isActive
                          ? "border-ochre bg-ochre/10 text-sand"
                          : "border-void-line text-sand-muted hover:border-ochre/40 hover:text-sand"
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="mt-4 font-body text-sm leading-relaxed text-sand-muted">
              Selecione Luanda para abrir a camada municipal desta fase.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleConfirmLocation}
              disabled={!province || !municipality}
              className="flex-1 rounded-[8px] border border-ochre/45 bg-ochre/10 px-4 py-3 font-mono text-[10px] tracking-[0.12em] uppercase text-sand transition-colors duration-300 hover:bg-ochre/15 disabled:cursor-not-allowed disabled:border-void-line disabled:bg-transparent disabled:text-sand-muted"
            >
              Confirmar localização
            </button>

            <button
              type="button"
              onClick={onStartSimulation}
              disabled={!selectedBusinessLocation}
              className="flex-1 rounded-[8px] border border-void-line bg-sand/[0.04] px-4 py-3 font-mono text-[10px] tracking-[0.12em] uppercase text-sand-muted transition-colors duration-300 hover:border-ochre/40 hover:text-sand disabled:cursor-not-allowed disabled:hover:border-void-line disabled:hover:text-sand-muted"
            >
              Iniciar simulação
            </button>
          </div>
        </>
      )}
    </motion.aside>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-void-line pb-3">
      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-sand-muted">
        {label}
      </span>
      <span className="max-w-[60%] text-right font-body text-sm text-sand">
        {value}
      </span>
    </div>
  );
}
