import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Place } from "@shared/schema";

const markerColors: Record<Place["category"], string> = {
  beach: "hsl(195, 20%, 55%)",
  restaurant: "hsl(15, 45%, 55%)",
  playground: "hsl(155, 25%, 42%)",
  attraction: "hsl(345, 25%, 60%)",
  activity: "hsl(35, 55%, 65%)",
};

function createIcon(color: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      background: ${color};
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

interface MapComponentProps {
  places: Place[];
  center?: [number, number];
  zoom?: number;
  onPlaceClick?: (id: string) => void;
}

export function MapComponent({
  places,
  center = [37.135, -8.452],
  zoom = 11,
  onPlaceClick,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(center, zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapInstanceRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();

    for (const place of places) {
      const icon = createIcon(markerColors[place.category]);
      const marker = L.marker([place.latitude, place.longitude], { icon });

      const popupContent = document.createElement("div");
      popupContent.innerHTML = `
        <div style="min-width: 150px;">
          <strong style="font-size: 14px;">${place.name}</strong>
          <p style="margin: 4px 0; font-size: 12px; color: #666;">${place.location}</p>
          <a href="#/place/${place.id}" style="font-size: 12px; color: hsl(15, 45%, 55%);">Bekijk details</a>
        </div>
      `;

      if (onPlaceClick) {
        const link = popupContent.querySelector("a");
        if (link) {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            onPlaceClick(place.id);
          });
        }
      }

      marker.bindPopup(popupContent);
      marker.addTo(markersRef.current!);
    }
  }, [places, onPlaceClick]);

  return <div ref={mapRef} className="w-full h-full" />;
}
