import type { StyleSpecification } from "maplibre-gl";

/**
 * Configuração central do mapa (MapLibre GL JS).
 *
 * Centraliza aqui evita espalhar "magic numbers" de posição/zoom pelos
 * componentes. Quando o World Engine ganhar navegação real por
 * província/município, estes valores passam a vir do estado da
 * simulação em vez de constantes fixas.
 */

/** Centro aproximado de Angola, usado como visão inicial do mapa. */
export const ANGOLA_MAP_CENTER: [number, number] = [17.8739, -11.2027];

/** Visão ampla inicial do país. */
export const ANGOLA_OVERVIEW_ZOOM = 4.85;

/** Zoom de entrada ao focar uma província. */
export const PROVINCE_FOCUS_ZOOM = 7.15;

/** Duração base das transições de câmera, em milissegundos. */
export const CAMERA_TRANSITION_DURATION_MS = 1600;

/** Alias mantido para compatibilidade com a base existente. */
export const ANGOLA_DEFAULT_ZOOM = ANGOLA_OVERVIEW_ZOOM;

/**
 * Estilo local do MapLibre.
 *
 * O default evita falhas de deploy/runtime causadas por tiles externos.
 * Não desenha fronteiras ou geometrias inventadas; a camada geográfica
 * real entra via MapTiler quando `NEXT_PUBLIC_MAPTILER_KEY` está definida.
 */
export const LOCAL_MAP_STYLE: StyleSpecification = {
  version: 8,
  name: "Simulador Angola Local Base",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#050607",
      },
    },
  ],
};

export const MAPTILER_API_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

export const MAPTILER_STYLE_URL = MAPTILER_API_KEY
  ? `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_API_KEY}`
  : null;

export const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? MAPTILER_STYLE_URL ?? LOCAL_MAP_STYLE;

export const MAP_MIN_ZOOM = 4;
export const MAP_MAX_ZOOM = 16;
