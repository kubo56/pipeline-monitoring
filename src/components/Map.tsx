"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import { Pipeline } from "@/types";

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

interface MapProps {
  pipelines: Pipeline[];
  threshold: number;
  onPipelineClick: (pipeline: Pipeline) => void;
}

/**
 * Custom marker icons for at-risk (red) and normal (green) pipelines
 */
const createCustomIcon = (isAtRisk: boolean) => {
  const color = isAtRisk ? "#ef4444" : "#10b981";
  const size = isAtRisk ? 16 : 14; // At-risk markers 10% larger
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

/**
 * Component to handle map bounds fitting and marker clustering
 */
function MapController({ 
  pipelines, 
  threshold, 
  onPipelineClick 
}: { 
  pipelines: Pipeline[]; 
  threshold: number; 
  onPipelineClick: (pipeline: Pipeline) => void;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const hasInitialized = useRef(false);

  // Fit bounds once on initial load
  useEffect(() => {
    if (!hasInitialized.current && pipelines.length > 0) {
      const bounds = L.latLngBounds(
        pipelines.map((p) => [p.lat, p.lon] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
      hasInitialized.current = true;
    }
  }, [pipelines, map]);

  // Handle marker clustering
  useEffect(() => {
    if (!map || pipelines.length === 0) return;

    // Remove existing cluster group
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }

    // Create new cluster group with Leaflet.markercluster
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 15,
    });

    // Add markers to cluster group
    pipelines.forEach((pipeline) => {
      const isAtRisk = pipeline.leakProb > threshold;
      
      const marker = L.marker([pipeline.lat, pipeline.lon], {
        icon: createCustomIcon(isAtRisk),
      });

      // Popup content
      const popupContent = `
        <div class="text-sm">
          <div class="font-bold text-slate-900">${pipeline.name}</div>
          <div class="text-xs text-slate-600 mt-1">
            <div>Pressure: ${pipeline.pressure_bar} bar</div>
            <div>Flow: ${pipeline.flow_m3h} m³/h</div>
            <div class="${isAtRisk ? 'text-red-600 font-semibold' : 'text-green-600'}">
              Leak Prob: ${(pipeline.leakProb * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("click", () => {
        onPipelineClick(pipeline);
      });
      
      clusterGroup.addLayer(marker);
    });

    // Add cluster group to map
    clusterGroup.addTo(map);
    clusterGroupRef.current = clusterGroup;

    // Cleanup function
    return () => {
      if (clusterGroupRef.current && map) {
        try {
          map.removeLayer(clusterGroupRef.current);
        } catch (e) {
          // Ignore errors during cleanup
        }
        clusterGroupRef.current = null;
      }
    };
  }, [map, pipelines, threshold, onPipelineClick]);

  return null;
}

/**
 * Map component with React Leaflet, clustering, and color-coded markers
 */
export default function Map({ pipelines, threshold, onPipelineClick }: MapProps) {
  // Center of Saudi Arabia
  const center: [number, number] = [24.0, 45.0];

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={6}
        style={{ width: "100%", height: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController 
          pipelines={pipelines} 
          threshold={threshold}
          onPipelineClick={onPipelineClick}
        />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-950/95 border border-slate-700/70 rounded-lg shadow-xl p-3 backdrop-blur-lg">
        <div className="text-[10px] font-bold text-white mb-2 uppercase tracking-wider">
          Legend
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white shadow-sm"></div>
            <span className="text-[11px] text-white font-semibold">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full border border-white shadow-sm"></div>
            <span className="text-[11px] text-white font-semibold">At-Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
