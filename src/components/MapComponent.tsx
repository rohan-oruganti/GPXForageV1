"use client";

import { MapContainer, TileLayer, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { parseGpx } from '@/lib/gpx';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
    mergedUrl?: string | null;
    fragments?: any[]; // { url, originalFilename, ... }
}

function AutoBounds({ tracks }: { tracks: [number, number][][] }) {
    const map = useMap();
    useEffect(() => {
        if (tracks.length === 0) return;
        const bounds = L.latLngBounds(tracks.flat() as any); // Type assertion for compatibility
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [tracks, map]);
    return null;
}

export default function Map({ mergedUrl, fragments }: MapProps) {
    const [fragmentTracks, setFragmentTracks] = useState<{ id: string, name: string, points: [number, number][] }[]>([]);
    const [mergedTrack, setMergedTrack] = useState<[number, number][]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Load Fragments
                if (fragments && fragments.length > 0) {
                    const loadedFragments = await Promise.all(fragments.map(async (f) => {
                        if (!f.url) return null;
                        try {
                            const res = await fetch(f.url);
                            const text = await res.text();
                            const points = parseGpx(text);
                            return {
                                id: f.id,
                                name: f.originalFilename,
                                points: points.map(p => [p.lat, p.lon] as [number, number])
                            };
                        } catch (e) {
                            console.error("Failed to load fragment", f.originalFilename, e);
                            return null;
                        }
                    }));
                    setFragmentTracks(loadedFragments.filter(f => f !== null) as any);
                }

                // Load Merged
                if (mergedUrl) {
                    const res = await fetch(mergedUrl);
                    const text = await res.text();
                    const points = parseGpx(text);
                    setMergedTrack(points.map(p => [p.lat, p.lon]));
                } else {
                    setMergedTrack([]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [fragments, mergedUrl]);

    if (loading) return <div className="h-full flex items-center justify-center bg-secondary/10"><Loader2 className="animate-spin text-primary" /></div>;

    const allTracksForBounds = [...fragmentTracks.map(f => f.points), mergedTrack].filter(t => t.length > 0);
    const center: [number, number] = allTracksForBounds.length > 0 && allTracksForBounds[0].length > 0 ? allTracksForBounds[0][0] : [51.505, -0.09];

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <MapContainer center={center} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Draw Fragments */}
            {!mergedTrack.length && fragmentTracks.map((track, i) => (
                <Polyline
                    key={track.id}
                    positions={track.points}
                    pathOptions={{ color: colors[i % colors.length], weight: 4, opacity: 0.7 }}
                >
                    <Tooltip sticky>{track.name}</Tooltip>
                </Polyline>
            ))}

            {/* Draw Merged Route (if exists, maybe hide fragments or show them dimmed? User said "after merge, draw merged route") */}
            {mergedTrack.length > 0 && (
                <Polyline
                    positions={mergedTrack}
                    pathOptions={{ color: '#000000', weight: 6 }}
                >
                    <Tooltip sticky>Merged Route</Tooltip>
                </Polyline>
            )}

            <AutoBounds tracks={allTracksForBounds} />
        </MapContainer>
    );
}
