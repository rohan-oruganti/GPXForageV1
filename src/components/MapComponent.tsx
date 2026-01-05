"use client";

import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
    gpxUrl?: string; // If merged
    fragments?: any[]; // If fragments
}

export default function Map({ gpxUrl, fragments }: MapProps) {
    const [tracks, setTracks] = useState<[number, number][][]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Simplified logic: If gpxUrl provided, fetch and parse.
        // For fragments, we'd need to fetch each.
        // For now, let's just support visualization if we implement parsing in frontend too or just fetch the file.
        // Since I don't want to duplicate parsing logic, I'll assume we can visualize if we have the lat/lons.
        // But we don't return lat/lons from API.
        // So I'll fetch the GPX file content and parse it using regex (simple) or DOMParser.

        async function loadGpx() {
            setLoading(true);
            try {
                if (gpxUrl) {
                    const res = await fetch(gpxUrl);
                    const text = await res.text();
                    const segments = parseGpx(text);
                    setTracks(segments);
                } else if (fragments && fragments.length > 0) {
                    // Fetch all fragments? Usage limits?
                    // Let's implement this later or simplified.
                    // For now, empty map logic.
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        loadGpx();
    }, [gpxUrl]); // eslint-disable-line

    if (loading) return <div className="h-full flex items-center justify-center bg-gray-100"><Loader2 className="animate-spin" /></div>;

    // Default center
    const center: [number, number] = tracks.length > 0 && tracks[0].length > 0 ? tracks[0][0] : [51.505, -0.09];

    return (
        <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="h-full w-full z-0">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {tracks.map((track, i) => (
                <Polyline key={i} positions={track} color="blue" />
            ))}
        </MapContainer>
    );
}

function parseGpx(gpxText: string): [number, number][][] {
    const parser = new DOMParser();
    const xml = parser.parseFromString(gpxText, "text/xml");
    const tracks = [];

    const trks = xml.getElementsByTagName("trk");
    for (let i = 0; i < trks.length; i++) {
        const trksegs = trks[i].getElementsByTagName("trkseg");
        for (let j = 0; j < trksegs.length; j++) {
            const trkpts = trksegs[j].getElementsByTagName("trkpt");
            const points: [number, number][] = [];
            for (let k = 0; k < trkpts.length; k++) {
                const lat = parseFloat(trkpts[k].getAttribute("lat") || "0");
                const lon = parseFloat(trkpts[k].getAttribute("lon") || "0");
                points.push([lat, lon]);
            }
            if (points.length > 0) tracks.push(points);
        }
    }
    return tracks;
}
