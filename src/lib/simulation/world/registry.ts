import { MOCK_COUNTRY } from "@/data/country.mock";
import { MOCK_MUNICIPALITIES } from "@/data/municipalities.mock";
import {
  MOCK_COMMUNES,
  MOCK_NEIGHBORHOODS,
} from "@/data/neighborhoods.mock";
import { MOCK_PROVINCES } from "@/data/provinces.mock";
import type {
  Commune,
  Country,
  Municipality,
  Neighborhood,
  Province,
  RegionalSocioeconomics,
  ZoneId,
} from "@/types/geo";

export interface ZoneHierarchy {
  zoneId: ZoneId;
  neighborhood: Neighborhood | null;
  commune: Commune | null;
  municipality: Municipality | null;
  province: Province | null;
  country: Country;
}

const country = MOCK_COUNTRY;

const provinceById = new Map(MOCK_PROVINCES.map((p) => [p.id, p]));
const municipalityById = new Map(MOCK_MUNICIPALITIES.map((m) => [m.id, m]));
const communeById = new Map(MOCK_COMMUNES.map((c) => [c.id, c]));
const neighborhoodById = new Map(MOCK_NEIGHBORHOODS.map((n) => [n.id, n]));

/** Perfil socioeconómico por defeito quando a zona não tem dados próprios. */
const DEFAULT_REGIONAL_PROFILE: RegionalSocioeconomics = {
  purchasingPowerIndex: 50,
  informalEconomyRate: 0.55,
  populationDensity: 5000,
  infrastructure: {
    powerStability: 50,
    waterSupply: 48,
    connectivity: 50,
    roadsLogistics: 48,
  },
  consumption: {
    premiumShare: 0.18,
    essentialShare: 0.6,
    informalPreference: 0.58,
  },
};

export function getCountry(): Country {
  return country;
}

export function getProvinces(): Province[] {
  return MOCK_PROVINCES;
}

export function getProvinceById(provinceId: string): Province | undefined {
  return provinceById.get(provinceId);
}

export function getMunicipalitiesByProvince(provinceId: string): Municipality[] {
  return MOCK_MUNICIPALITIES.filter((m) => m.provinceId === provinceId);
}

export function getMunicipalityById(
  municipalityId: string,
): Municipality | undefined {
  return municipalityById.get(municipalityId);
}

export function getNeighborhoodById(zoneId: ZoneId): Neighborhood | undefined {
  return neighborhoodById.get(zoneId);
}

export function getCommuneById(communeId: string): Commune | undefined {
  return communeById.get(communeId);
}

export function getAllZones(): Neighborhood[] {
  return MOCK_NEIGHBORHOODS;
}

/**
 * Resolve a hierarquia territorial completa a partir de qualquer `zoneId`
 * (bairro, município ou província).
 */
export function resolveZoneHierarchy(zoneId: ZoneId): ZoneHierarchy | null {
  const neighborhood = neighborhoodById.get(zoneId);
  if (neighborhood) {
    const commune = communeById.get(neighborhood.communeId) ?? null;
    const municipality = commune
      ? (municipalityById.get(commune.municipalityId) ?? null)
      : null;
    const province = municipality
      ? (provinceById.get(municipality.provinceId) ?? null)
      : null;

    return {
      zoneId: neighborhood.id,
      neighborhood,
      commune,
      municipality,
      province,
      country,
    };
  }

  const municipality = municipalityById.get(zoneId);
  if (municipality) {
    return {
      zoneId: municipality.id,
      neighborhood: null,
      commune: null,
      municipality,
      province: provinceById.get(municipality.provinceId) ?? null,
      country,
    };
  }

  const province = provinceById.get(zoneId);
  if (province) {
    return {
      zoneId: province.id,
      neighborhood: null,
      commune: null,
      municipality: null,
      province,
      country,
    };
  }

  return null;
}

/** Obtém o perfil socioeconómico de uma zona, com fallback hierárquico. */
export function getRegionalProfile(zoneId: ZoneId): RegionalSocioeconomics {
  const hierarchy = resolveZoneHierarchy(zoneId);
  if (!hierarchy) return DEFAULT_REGIONAL_PROFILE;

  if (hierarchy.neighborhood?.socioeconomics) {
    return hierarchy.neighborhood.socioeconomics;
  }

  // Fallback: ajuste leve com base no detailLevel da província
  if (hierarchy.province?.detailLevel === "detailed") {
    return {
      ...DEFAULT_REGIONAL_PROFILE,
      purchasingPowerIndex: 60,
      infrastructure: {
        ...DEFAULT_REGIONAL_PROFILE.infrastructure,
        connectivity: 65,
      },
    };
  }

  return DEFAULT_REGIONAL_PROFILE;
}
