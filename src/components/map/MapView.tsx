"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  ANGOLA_OVERVIEW_ZOOM,
  CAMERA_TRANSITION_DURATION_MS,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_STYLE,
  LOCAL_MAP_STYLE,
  PROVINCE_FOCUS_ZOOM,
} from "@/lib/map/config";
import { WORLD_OVERVIEW_CENTER, WORLD_PROVINCES } from "@/data/world-map.mock";
import { MOCK_MUNICIPALITIES } from "@/data/municipalities.mock";

interface MapViewProps {
  activeProvinceId: string | null;
  activeMunicipalityId: string | null;
  onProvinceSelect: (provinceId: string) => void;
  onMunicipalitySelect: (municipalityId: string | null) => void;
  markerCoordinates?: { lat: number; lng: number } | null;
  markerLabel?: string;
}

type ProvinceFeatureProperties = {
  provinceId: string;
  name: string;
  slug: string;
  featured: boolean;
};

type MunicipalityFeatureProperties = {
  municipalityId: string;
  provinceId: string;
  name: string;
  featured: boolean;
};

const PROVINCE_SOURCE_ID = "angola-province-points";
const PROVINCE_HIT_LAYER_ID = "angola-province-hit";
const PROVINCE_GLOW_LAYER_ID = "angola-province-glow";
const PROVINCE_DOT_LAYER_ID = "angola-province-dot";

const MUNICIPALITY_SOURCE_ID = "luanda-municipality-points";
const MUNICIPALITY_HIT_LAYER_ID = "luanda-municipality-hit";
const MUNICIPALITY_GLOW_LAYER_ID = "luanda-municipality-glow";
const MUNICIPALITY_DOT_LAYER_ID = "luanda-municipality-dot";
const MUNICIPALITY_FOCUS_ZOOM = 10.65;

const PROVINCE_COLLECTION: GeoJSON.FeatureCollection<
  GeoJSON.Point,
  ProvinceFeatureProperties
> = {
  type: "FeatureCollection",
  features: WORLD_PROVINCES.map(({ province, featured }) => ({
    type: "Feature",
    id: province.id,
    properties: {
      provinceId: province.id,
      name: province.name,
      slug: province.slug,
      featured: Boolean(featured),
    },
    geometry: {
      type: "Point",
      coordinates: [province.coordinates.lng, province.coordinates.lat],
    },
  })),
};

const LUANDA_MUNICIPALITIES = MOCK_MUNICIPALITIES.filter(
  (municipality) => municipality.provinceId === "prov-luanda",
);

const MUNICIPALITY_COLLECTION: GeoJSON.FeatureCollection<
  GeoJSON.Point,
  MunicipalityFeatureProperties
> = {
  type: "FeatureCollection",
  features: LUANDA_MUNICIPALITIES.map((municipality, index) => ({
    type: "Feature",
    id: municipality.id,
    properties: {
      municipalityId: municipality.id,
      provinceId: municipality.provinceId,
      name: municipality.name,
      featured: index === 0,
    },
    geometry: {
      type: "Point",
      coordinates: [municipality.coordinates.lng, municipality.coordinates.lat],
    },
  })),
};

const provinceLookup = new Map(
  WORLD_PROVINCES.map(({ province }) => [province.id, province] as const),
);

const municipalityLookup = new Map(
  LUANDA_MUNICIPALITIES.map((municipality) => [municipality.id, municipality] as const),
);

function getProvinceById(provinceId: string) {
  return provinceLookup.get(provinceId);
}

function getMunicipalityById(municipalityId: string) {
  return municipalityLookup.get(municipalityId);
}

function getInitialMapView(
  provinceId: string | null,
  municipalityId: string | null,
) {
  const municipality = municipalityId ? getMunicipalityById(municipalityId) : null;
  if (municipality) {
    return {
      center: [municipality.coordinates.lng, municipality.coordinates.lat] as [
        number,
        number,
      ],
      zoom: MUNICIPALITY_FOCUS_ZOOM,
    };
  }

  const province = provinceId ? getProvinceById(provinceId) : null;
  if (province) {
    return {
      center: [province.coordinates.lng, province.coordinates.lat] as [
        number,
        number,
      ],
      zoom: PROVINCE_FOCUS_ZOOM,
    };
  }

  return {
    center: WORLD_OVERVIEW_CENTER,
    zoom: ANGOLA_OVERVIEW_ZOOM,
  };
}

function setLayerVisibility(
  map: maplibregl.Map,
  layerId: string,
  visible: boolean,
) {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

export function MapView({
  activeProvinceId,
  activeMunicipalityId,
  onProvinceSelect,
  onMunicipalitySelect,
  markerCoordinates = null,
  markerLabel,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const hoveredProvinceIdRef = useRef<string | null>(null);
  const hoveredMunicipalityIdRef = useRef<string | null>(null);
  const selectedProvinceIdRef = useRef<string | null>(null);
  const selectedMunicipalityIdRef = useRef<string | null>(null);
  const onProvinceSelectRef = useRef(onProvinceSelect);
  const onMunicipalitySelectRef = useRef(onMunicipalitySelect);

  useEffect(() => {
    onProvinceSelectRef.current = onProvinceSelect;
  }, [onProvinceSelect]);

  useEffect(() => {
    onMunicipalitySelectRef.current = onMunicipalitySelect;
  }, [onMunicipalitySelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialView = getInitialMapView(activeProvinceId, activeMunicipalityId);
    const mapContainer = containerRef.current;

    const map = new maplibregl.Map({
      container: mapContainer,
      style: MAP_STYLE,
      center: initialView.center,
      zoom: initialView.zoom,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: true,
    });

    map.scrollZoom.enable();
    map.touchZoomRotate.disableRotation();
    let fallbackStyleApplied = false;
    map.on("error", (event) => {
      if (fallbackStyleApplied || MAP_STYLE === LOCAL_MAP_STYLE) return;
      const message = event.error?.message ?? "";
      if (/style|source|tile|401|403|404/i.test(message)) {
        fallbackStyleApplied = true;
        map.setStyle(LOCAL_MAP_STYLE);
      }
    });

    let resizeFrame = window.requestAnimationFrame(() => map.resize());
    const resizeObserver = new ResizeObserver(() => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => map.resize());
    });
    resizeObserver.observe(mapContainer);

    const clearPopup = () => {
      popupRef.current?.remove();
      popupRef.current = null;
    };

    const setCursor = (cursor: string) => {
      map.getCanvas().style.cursor = cursor;
    };

    const clearProvinceHover = () => {
      const hoveredProvinceId = hoveredProvinceIdRef.current;
      if (hoveredProvinceId) {
        map.setFeatureState(
          { source: PROVINCE_SOURCE_ID, id: hoveredProvinceId },
          { hover: false },
        );
      }
      hoveredProvinceIdRef.current = null;
    };

    const clearMunicipalityHover = () => {
      const hoveredMunicipalityId = hoveredMunicipalityIdRef.current;
      if (hoveredMunicipalityId) {
        map.setFeatureState(
          { source: MUNICIPALITY_SOURCE_ID, id: hoveredMunicipalityId },
          { hover: false },
        );
      }
      hoveredMunicipalityIdRef.current = null;
    };

    const focusProvince = (provinceId: string) => {
      const province = getProvinceById(provinceId);
      if (!province) return;

      map.easeTo({
        center: [province.coordinates.lng, province.coordinates.lat],
        zoom: PROVINCE_FOCUS_ZOOM,
        duration: CAMERA_TRANSITION_DURATION_MS,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      });
    };

    const focusMunicipality = (municipalityId: string) => {
      const municipality = getMunicipalityById(municipalityId);
      if (!municipality) return;

      map.easeTo({
        center: [municipality.coordinates.lng, municipality.coordinates.lat],
        zoom: MUNICIPALITY_FOCUS_ZOOM,
        duration: CAMERA_TRANSITION_DURATION_MS,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      });
    };

    map.on("load", () => {
      map.resize();

      map.addSource(PROVINCE_SOURCE_ID, {
        type: "geojson",
        data: PROVINCE_COLLECTION,
      });

      if (markerCoordinates) {
        const marker = new maplibregl.Marker({ color: "#f2b35f" })
          .setLngLat([markerCoordinates.lng, markerCoordinates.lat])
          .setPopup(markerLabel ? new maplibregl.Popup({ offset: 18 }).setText(markerLabel) : undefined)
          .addTo(map);
        map.once("remove", () => marker.remove());
      }

      map.addSource(MUNICIPALITY_SOURCE_ID, {
        type: "geojson",
        data: MUNICIPALITY_COLLECTION,
      });

      map.addLayer({
        id: PROVINCE_HIT_LAYER_ID,
        type: "circle",
        source: PROVINCE_SOURCE_ID,
        paint: {
          "circle-radius": 18,
          "circle-color": "rgba(255, 255, 255, 0.001)",
        },
      });

      map.addLayer({
        id: PROVINCE_GLOW_LAYER_ID,
        type: "circle",
        source: PROVINCE_SOURCE_ID,
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            22,
            ["boolean", ["feature-state", "hover"], false],
            18,
            ["get", "featured"],
            16,
            12,
          ],
          "circle-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#f2b35f",
            ["boolean", ["feature-state", "hover"], false],
            "#dd9a47",
            ["get", "featured"],
            "#c98a3c",
            "#a76d2f",
          ],
          "circle-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            0.34,
            ["boolean", ["feature-state", "hover"], false],
            0.26,
            ["get", "featured"],
            0.18,
            0.08,
          ],
          "circle-blur": 0.85,
        },
      });

      map.addLayer({
        id: PROVINCE_DOT_LAYER_ID,
        type: "circle",
        source: PROVINCE_SOURCE_ID,
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            5.5,
            ["boolean", ["feature-state", "hover"], false],
            4.5,
            ["get", "featured"],
            4.2,
            3.4,
          ],
          "circle-color": "#ede6d8",
          "circle-opacity": 0.92,
          "circle-stroke-color": "#0a0c0e",
          "circle-stroke-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            1.8,
            ["boolean", ["feature-state", "hover"], false],
            1.4,
            1,
          ],
        },
      });

      map.addLayer({
        id: MUNICIPALITY_HIT_LAYER_ID,
        type: "circle",
        source: MUNICIPALITY_SOURCE_ID,
        layout: {
          visibility: "none",
        },
        paint: {
          "circle-radius": 14,
          "circle-color": "rgba(255, 255, 255, 0.001)",
        },
      });

      map.addLayer({
        id: MUNICIPALITY_GLOW_LAYER_ID,
        type: "circle",
        source: MUNICIPALITY_SOURCE_ID,
        layout: {
          visibility: "none",
        },
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            18,
            ["boolean", ["feature-state", "hover"], false],
            15,
            ["get", "featured"],
            13,
            11,
          ],
          "circle-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#6d9bd8",
            ["boolean", ["feature-state", "hover"], false],
            "#89b0e4",
            ["get", "featured"],
            "#5c84bd",
            "#415a80",
          ],
          "circle-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            0.34,
            ["boolean", ["feature-state", "hover"], false],
            0.24,
            ["get", "featured"],
            0.16,
            0.08,
          ],
          "circle-blur": 0.8,
        },
      });

      map.addLayer({
        id: MUNICIPALITY_DOT_LAYER_ID,
        type: "circle",
        source: MUNICIPALITY_SOURCE_ID,
        layout: {
          visibility: "none",
        },
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            4.8,
            ["boolean", ["feature-state", "hover"], false],
            4.1,
            ["get", "featured"],
            3.8,
            3,
          ],
          "circle-color": "#edf6ff",
          "circle-opacity": 0.88,
          "circle-stroke-color": "#0a0c0e",
          "circle-stroke-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            1.5,
            ["boolean", ["feature-state", "hover"], false],
            1.2,
            0.9,
          ],
        },
      });

      if (activeProvinceId) {
        map.setFeatureState(
          { source: PROVINCE_SOURCE_ID, id: activeProvinceId },
          { selected: true },
        );
        selectedProvinceIdRef.current = activeProvinceId;
      }

      const province = activeProvinceId ? getProvinceById(activeProvinceId) : null;
      const isLuanda = province?.slug === "luanda";
      setLayerVisibility(map, MUNICIPALITY_HIT_LAYER_ID, Boolean(isLuanda));
      setLayerVisibility(map, MUNICIPALITY_GLOW_LAYER_ID, Boolean(isLuanda));
      setLayerVisibility(map, MUNICIPALITY_DOT_LAYER_ID, Boolean(isLuanda));

      if (activeMunicipalityId) {
        map.setFeatureState(
          { source: MUNICIPALITY_SOURCE_ID, id: activeMunicipalityId },
          { selected: true },
        );
        selectedMunicipalityIdRef.current = activeMunicipalityId;
      }

      map.on("mouseenter", PROVINCE_HIT_LAYER_ID, (event) => {
        const feature = event.features?.[0];
        if (!feature) return;

        const provinceId = String(feature.id ?? "");
        if (!provinceId) return;

        setCursor("pointer");
        clearProvinceHover();
        hoveredProvinceIdRef.current = provinceId;
        map.setFeatureState(
          { source: PROVINCE_SOURCE_ID, id: provinceId },
          { hover: true },
        );

        const province = getProvinceById(provinceId);
        if (!province) return;

        clearPopup();
        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 16,
          className: "province-popup",
        })
          .setLngLat([province.coordinates.lng, province.coordinates.lat])
          .setHTML(`<div class="province-popup__label">${province.name}</div>`)
          .addTo(map);
      });

      map.on("mouseleave", PROVINCE_HIT_LAYER_ID, () => {
        setCursor("");
        clearProvinceHover();
        clearPopup();
      });

      map.on("click", PROVINCE_HIT_LAYER_ID, (event) => {
        const feature = event.features?.[0];
        if (!feature) return;

        const provinceId = String(feature.id ?? "");
        if (!provinceId) return;

        focusProvince(provinceId);
        onProvinceSelectRef.current(provinceId);
      });

      map.on("mouseenter", MUNICIPALITY_HIT_LAYER_ID, (event) => {
        const feature = event.features?.[0];
        if (!feature) return;

        const municipalityId = String(feature.id ?? "");
        if (!municipalityId) return;

        setCursor("pointer");
        clearMunicipalityHover();
        hoveredMunicipalityIdRef.current = municipalityId;
        map.setFeatureState(
          { source: MUNICIPALITY_SOURCE_ID, id: municipalityId },
          { hover: true },
        );

        const municipality = getMunicipalityById(municipalityId);
        if (!municipality) return;

        clearPopup();
        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 14,
          className: "province-popup",
        })
          .setLngLat([municipality.coordinates.lng, municipality.coordinates.lat])
          .setHTML(
            `<div class="province-popup__label">${municipality.name}</div>`,
          )
          .addTo(map);
      });

      map.on("mouseleave", MUNICIPALITY_HIT_LAYER_ID, () => {
        setCursor("");
        clearMunicipalityHover();
        clearPopup();
      });

      map.on("click", MUNICIPALITY_HIT_LAYER_ID, (event) => {
        const feature = event.features?.[0];
        if (!feature) return;

        const municipalityId = String(feature.id ?? "");
        if (!municipalityId) return;

        focusMunicipality(municipalityId);
        onMunicipalitySelectRef.current(municipalityId);
      });

      mapRef.current = map;
    });

    return () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      clearProvinceHover();
      clearMunicipalityHover();
      clearPopup();
      map.remove();
      mapRef.current = null;
      selectedProvinceIdRef.current = null;
      selectedMunicipalityIdRef.current = null;
      hoveredProvinceIdRef.current = null;
      hoveredMunicipalityIdRef.current = null;
    };
  }, [activeMunicipalityId, activeProvinceId, markerCoordinates, markerLabel]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const previousProvinceId = selectedProvinceIdRef.current;
    if (previousProvinceId && previousProvinceId !== activeProvinceId) {
      map.setFeatureState(
        { source: PROVINCE_SOURCE_ID, id: previousProvinceId },
        { selected: false },
      );
    }

    if (activeProvinceId) {
      map.setFeatureState(
        { source: PROVINCE_SOURCE_ID, id: activeProvinceId },
        { selected: true },
      );
    }

    selectedProvinceIdRef.current = activeProvinceId;

    const province = activeProvinceId ? getProvinceById(activeProvinceId) : null;
    const isLuanda = province?.slug === "luanda";

    setLayerVisibility(map, MUNICIPALITY_HIT_LAYER_ID, Boolean(isLuanda));
    setLayerVisibility(map, MUNICIPALITY_GLOW_LAYER_ID, Boolean(isLuanda));
    setLayerVisibility(map, MUNICIPALITY_DOT_LAYER_ID, Boolean(isLuanda));

    if (!activeProvinceId) {
      selectedMunicipalityIdRef.current = null;
      map.easeTo({
        center: WORLD_OVERVIEW_CENTER,
        zoom: ANGOLA_OVERVIEW_ZOOM,
        duration: CAMERA_TRANSITION_DURATION_MS,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      });
      return;
    }

    if (province) {
      map.easeTo({
        center: [province.coordinates.lng, province.coordinates.lat],
        zoom: isLuanda ? PROVINCE_FOCUS_ZOOM : PROVINCE_FOCUS_ZOOM - 0.15,
        duration: CAMERA_TRANSITION_DURATION_MS,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      });
    }
  }, [activeProvinceId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const previousMunicipalityId = selectedMunicipalityIdRef.current;
    if (
      previousMunicipalityId &&
      previousMunicipalityId !== activeMunicipalityId
    ) {
      map.setFeatureState(
        { source: MUNICIPALITY_SOURCE_ID, id: previousMunicipalityId },
        { selected: false },
      );
    }

    if (activeMunicipalityId) {
      map.setFeatureState(
        { source: MUNICIPALITY_SOURCE_ID, id: activeMunicipalityId },
        { selected: true },
      );

      const municipality = getMunicipalityById(activeMunicipalityId);
      if (municipality) {
        map.easeTo({
          center: [municipality.coordinates.lng, municipality.coordinates.lat],
          zoom: MUNICIPALITY_FOCUS_ZOOM,
          duration: CAMERA_TRANSITION_DURATION_MS,
          easing: (t) => 1 - Math.pow(1 - t, 3),
        });
      }
    }

    selectedMunicipalityIdRef.current = activeMunicipalityId;
  }, [activeMunicipalityId]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full min-h-[400px] w-full bg-[#101820]"
      aria-label="Mapa interativo de Angola com seis províncias disponíveis"
    />
  );
}
