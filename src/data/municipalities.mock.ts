import type { Municipality } from "@/types/geo";

/**
 * DADOS MOCKADOS — municípios de Luanda, a primeira província a receber
 * maior detalhamento. As demais províncias ainda não têm municípios
 * mockados nesta fase; serão adicionados conforme o World Engine evolui.
 */
export const MOCK_MUNICIPALITIES: Municipality[] = [
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
    id: "mun-belas",
    type: "municipality",
    provinceId: "prov-luanda",
    name: "Belas",
    slug: "belas",
    coordinates: { lat: -8.9833, lng: 13.1833 },
    detailLevel: "basic",
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
    detailLevel: "basic",
  },
  {
    id: "mun-viana",
    type: "municipality",
    provinceId: "prov-luanda",
    name: "Viana",
    slug: "viana",
    coordinates: { lat: -8.9035, lng: 13.3741 },
    detailLevel: "basic",
  },
];
