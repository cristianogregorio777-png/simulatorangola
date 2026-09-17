import type { Country } from "@/types/geo";

/** Angola — raiz da hierarquia territorial do simulador. */
export const MOCK_COUNTRY: Country = {
  id: "country-angola",
  type: "country",
  isoCode: "AO",
  name: "Angola",
  slug: "angola",
  coordinates: { lat: -11.2027, lng: 17.8739 },
  detailLevel: "outline",
};
