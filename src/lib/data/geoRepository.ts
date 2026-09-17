import type { Commune, Municipality, Neighborhood, Province } from "@/types/geo";
import { MOCK_PROVINCES } from "@/data/provinces.mock";
import { MOCK_MUNICIPALITIES } from "@/data/municipalities.mock";
import {
  MOCK_COMMUNES,
  MOCK_NEIGHBORHOODS,
} from "@/data/neighborhoods.mock";

/**
 * Camada de acesso a dados geográficos.
 *
 * Nesta fase, todas as funções retornam dados mockados de `src/data/`.
 * O objetivo desta camada é isolar o resto da aplicação da origem dos
 * dados: quando o World Engine passar a usar Supabase, apenas as
 * implementações abaixo mudam — nenhum componente que consome este
 * repositório precisará ser alterado.
 *
 * Todas as funções são assíncronas de propósito, mesmo hoje só lendo
 * arrays em memória, para que a futura troca por chamadas Supabase seja
 * transparente para quem consome este módulo.
 */
export async function getProvinces(): Promise<Province[]> {
  return MOCK_PROVINCES;
}

export async function getProvinceBySlug(
  slug: string,
): Promise<Province | undefined> {
  return MOCK_PROVINCES.find((province) => province.slug === slug);
}

export async function getMunicipalitiesByProvince(
  provinceId: string,
): Promise<Municipality[]> {
  return MOCK_MUNICIPALITIES.filter(
    (municipality) => municipality.provinceId === provinceId,
  );
}

export async function getCommunesByMunicipality(
  municipalityId: string,
): Promise<Commune[]> {
  return MOCK_COMMUNES.filter(
    (commune) => commune.municipalityId === municipalityId,
  );
}

export async function getNeighborhoodsByCommune(
  communeId: string,
): Promise<Neighborhood[]> {
  return MOCK_NEIGHBORHOODS.filter(
    (neighborhood) => neighborhood.communeId === communeId,
  );
}

export async function getNeighborhoodById(
  zoneId: string,
): Promise<Neighborhood | undefined> {
  return MOCK_NEIGHBORHOODS.find((neighborhood) => neighborhood.id === zoneId);
}
