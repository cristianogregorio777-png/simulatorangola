import type { Municipality } from "@/types/geo";

/**
 * DADOS MOCKADOS — municípios de Luanda, a primeira província a receber
 * maior detalhamento. As demais províncias ainda não têm municípios
 * mockados nesta fase; serão adicionados conforme o World Engine evolui.
 */
export const MOCK_MUNICIPALITIES: Municipality[] = [
  // — Luanda (detalhado) —
  {
    id: "mun-luanda",
    type: "municipality",
    provinceId: "prov-luanda",
    name: "Luanda",
    slug: "luanda",
    coordinates: { lat: -8.8147, lng: 13.2302 },
    detailLevel: "detailed",
  },
  {
    id: "mun-maianga",
    type: "municipality",
    provinceId: "prov-luanda",
    name: "Maianga",
    slug: "maianga",
    coordinates: { lat: -8.8267, lng: 13.2467 },
    detailLevel: "detailed",
  },
  {
    id: "mun-belas",
    type: "municipality",
    provinceId: "prov-luanda",
    name: "Belas",
    slug: "belas",
    coordinates: { lat: -8.9833, lng: 13.1833 },
    detailLevel: "detailed",
  },
  {
    id: "mun-cacuaco",
    type: "municipality",
    provinceId: "prov-luanda",
    name: "Cacuaco",
    slug: "cacuaco",
    coordinates: { lat: -8.7833, lng: 13.3667 },
    detailLevel: "basic",
  },
  {
    id: "mun-cazenga",
    type: "municipality",
    provinceId: "prov-luanda",
    name: "Cazenga",
    slug: "cazenga",
    coordinates: { lat: -8.8391, lng: 13.2841 },
    detailLevel: "detailed",
  },
  {
    id: "mun-viana",
    type: "municipality",
    provinceId: "prov-luanda",
    name: "Viana",
    slug: "viana",
    coordinates: { lat: -8.9035, lng: 13.3741 },
    detailLevel: "detailed",
  },
  {
    id: "mun-talatona",
    type: "municipality",
    provinceId: "prov-luanda",
    name: "Talatona",
    slug: "talatona",
    coordinates: { lat: -8.9167, lng: 13.1833 },
    detailLevel: "detailed",
  },
  // — Outras províncias (nível básico) —
  {
    id: "mun-benguela-city",
    type: "municipality",
    provinceId: "prov-benguela",
    name: "Benguela",
    slug: "benguela-city",
    coordinates: { lat: -12.5763, lng: 13.4055 },
    detailLevel: "basic",
  },
  {
    id: "mun-lobito",
    type: "municipality",
    provinceId: "prov-benguela",
    name: "Lobito",
    slug: "lobito",
    coordinates: { lat: -12.3644, lng: 13.5361 },
    detailLevel: "basic",
  },
  {
    id: "mun-huambo-city",
    type: "municipality",
    provinceId: "prov-huambo",
    name: "Huambo",
    slug: "huambo-city",
    coordinates: { lat: -12.7761, lng: 15.7392 },
    detailLevel: "basic",
  },
  {
    id: "mun-cabinda-city",
    type: "municipality",
    provinceId: "prov-cabinda",
    name: "Cabinda",
    slug: "cabinda-city",
    coordinates: { lat: -5.555, lng: 12.200 },
    detailLevel: "basic",
  },
  {
    id: "mun-lubango",
    type: "municipality",
    provinceId: "prov-huila",
    name: "Lubango",
    slug: "lubango",
    coordinates: { lat: -14.9177, lng: 13.4925 },
    detailLevel: "basic",
  },
];
