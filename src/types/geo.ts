/**
 * Tipos geográficos do Simulador de Negócios Angolano.
 *
 * Hierarquia territorial suportada:
 *
 *   Angola
 *     -> Province        (Província)
 *       -> Municipality   (Município)
 *         -> Commune      (Comuna)
 *           -> District    (Distrito)
 *             -> Neighborhood (Bairro/Zona)
 *               -> Location    (ponto específico no mapa)
 *
 * Estes tipos representam a FORMA dos dados. Nesta fase os dados em si
 * são mockados (ver `src/data/`), mas a estrutura já suporta qualquer
 * província de Angola, não apenas Luanda.
 */

/** Coordenadas geográficas (WGS84), usadas por MapLibre e Three.js. */
export interface GeoCoordinates {
  lat: number;
  lng: number;
}

/** Nível de detalhamento de dados disponível para uma região. */
export type DetailLevel = "outline" | "basic" | "detailed";

interface GeoEntityBase {
  id: string;
  name: string;
  /** Nome usado internamente/slug, ex: "luanda", "benguela". */
  slug: string;
  coordinates: GeoCoordinates;
  /** Quão detalhados são os dados desta região nesta fase do projeto. */
  detailLevel: DetailLevel;
}

/** Província de Angola (18 no total). */
export interface Province extends GeoEntityBase {
  type: "province";
  countryCode: "AO";
}

/** Município dentro de uma província. */
export interface Municipality extends GeoEntityBase {
  type: "municipality";
  provinceId: string;
}

/** Comuna dentro de um município. */
export interface Commune extends GeoEntityBase {
  type: "commune";
  municipalityId: string;
}

/** Distrito urbano/administrativo (nem toda comuna tem distritos mapeados ainda). */
export interface District extends GeoEntityBase {
  type: "district";
  communeId: string;
}

/** Bairro ou zona, o nível mais granular de área habitada. */
export interface Neighborhood extends GeoEntityBase {
  type: "neighborhood";
  /** Pode pertencer a um distrito ou diretamente a uma comuna, dependendo do detalhamento. */
  districtId?: string;
  communeId: string;
}

/** Um ponto específico no mapa (ex: onde um negócio pode ser instalado). */
export interface Location extends GeoEntityBase {
  type: "location";
  neighborhoodId: string;
  address?: string;
}

/** União de todas as entidades geográficas da hierarquia. */
export type GeoEntity =
  | Province
  | Municipality
  | Commune
  | District
  | Neighborhood
  | Location;

/** Categoria de negócio (lista inicial, expansível). */
export type BusinessCategory =
  | "retail"
  | "food_and_beverage"
  | "services"
  | "logistics"
  | "manufacturing"
  | "technology"
  | "real_estate"
  | "other";

/** Um negócio posicionado em uma localização do mapa. */
export interface BusinessLocation {
  id: string;
  name: string;
  category: BusinessCategory;
  locationId: string;
  ownerId: string;
  coordinates: GeoCoordinates;
  /** Estado simplificado nesta fase; o Business Engine irá expandir isto. */
  status: "planned" | "active" | "closed";
  createdAt: string;
  /** Guarda a província de origem da localização selecionada. */
  provinceId?: string;
  /** Guarda o município de origem da localização selecionada. */
  municipalityId?: string | null;
  /** Nome de zona/área quando ainda estamos em fase mock. */
  zoneLabel?: string | null;
  /** Indica que este registo é uma seleção de preparação, não um negócio ativo. */
  isDraftSelection?: boolean;
}
