import type { BusinessLocation, Municipality, Province } from "@/types/geo";

interface BuildDraftBusinessLocationInput {
  province: Province;
  municipality: Municipality | null;
}

/**
 * Constrói um `BusinessLocation` de preparação a partir da seleção
 * geográfica atual.
 *
 * Nesta fase a localização ainda não representa um negócio real; ela é
 * apenas o registo persistido da escolha do jogador para que o futuro
 * Simulation Engine consiga retomá-la.
 */
export function buildDraftBusinessLocation({
  province,
  municipality,
}: BuildDraftBusinessLocationInput): BusinessLocation {
  const now = new Date().toISOString();
  const locationId = municipality?.id ?? province.id;
  const label = municipality
    ? `${province.name} / ${municipality.name}`
    : province.name;

  return {
    id: `draft:${province.slug}:${municipality?.slug ?? "province"}`,
    name: label,
    category: "other",
    locationId,
    ownerId: "draft",
    coordinates: municipality?.coordinates ?? province.coordinates,
    status: "planned",
    createdAt: now,
    provinceId: province.id,
    municipalityId: municipality?.id ?? null,
    zoneLabel: municipality?.name ?? province.name,
    isDraftSelection: true,
  };
}
