"use client";

import { MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.heat'; // We will assume this is available or we polyfill/invoke L.heatLayer

// Extend Leaflet type to include heatLayer
declare module 'leaflet' {
    export function heatLayer(latlngs: Array<[number, number, number]>, options?: any): any;
}

// Simple centroids for demo - expanded list
const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
    'US': [37.0902, -95.7129],
    'CA': [56.1304, -106.3468],
    'GB': [55.3781, -3.4360],
    'DE': [51.1657, 10.4515],
    'FR': [46.2276, 2.2137],
    'AU': [-25.2744, 133.7751],
    'JP': [36.2048, 138.2529],
    'BR': [-14.2350, -51.9253],
    'IN': [20.5937, 78.9629],
    'CN': [35.8617, 104.1954],
    'RU': [61.5240, 105.3188],
    'ZA': [-30.5595, 22.9375]
};

function HeatmapLayer({ points }: { points: [number, number, number][] }) {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) return;

        // Create heat layer
        const heat = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 10,
            max: 1.0,
            gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
        }).addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [points, map]);

    return null;
}

export default function AnalyticsMap({ data }: { data: { code: string, count: number }[] }) {

    // Convert country counts to weighted points for heatmap: [lat, lng, intensity]
    // Intensity normalized? Or just raw count? Leaflet.heat likes 0-1 usually, or we set max.
    const heatPoints = useMemo(() => {
        const maxCount = Math.max(...data.map(d => d.count), 1);
        return data.map(item => {
            const pos = COUNTRY_CENTROIDS[item.code];
            if (!pos) return null;
            // Intensity: normalize relative to max count in dataset
            return [pos[0], pos[1], item.count / maxCount];
        }).filter(Boolean) as [number, number, number][];
    }, [data]);

    return (
        <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }} className="rounded-md z-0 bg-slate-100">
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <HeatmapLayer points={heatPoints} />
        </MapContainer>
    );
}
