import { MOCK_PROVINCES } from "@/data/provinces.mock";
import type { Province } from "@/types/geo";

export interface WorldProvinceMapData {
  province: Province;
  /** Marca a província principal da primeira fase visual. */
  featured?: boolean;
}

const WORLD_PROVINCE_ORDER = [
  "luanda",
  "benguela",
  "huila",
  "huambo",
  "cabinda",
  "namibe",
] as const;

const provinceBySlug = new Map(
  MOCK_PROVINCES.map((province) => [province.slug, province] as const),
);

/**
 * Estrutura de visualização da World Screen nesta fase.
 *
 * Aqui usamos apenas 6 províncias e reaproveitamos os centros já mockados
 * na camada geográfica existente. Não há fronteiras inventadas: quando os
 * dados reais chegarem, esta camada será substituída por geometria oficial.
 */
export const WORLD_PROVINCES: WorldProvinceMapData[] = WORLD_PROVINCE_ORDER.map(
  (slug) => {
    const province = provinceBySlug.get(slug);

    if (!province) {
      throw new Error(`Missing mock province for slug: ${slug}`);
    }

    return {
      province,
      featured: slug === "luanda",
    };
  },
);

export const WORLD_OVERVIEW_CENTER: [number, number] = [17.8739, -11.2027];
