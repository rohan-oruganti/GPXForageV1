import { XMLParser, XMLBuilder } from "fast-xml-parser";

export interface TrackPoint {
    lat: number;
    lon: number;
    ele: number;
    time: Date;
    hr?: number;
    cad?: number;
    power?: number;
}

export interface MergePolicy {
    // We can expand this later, currently implicit in the function logic as requested
    // "for extensions, choose non-null values; if both exist and differ, prefer the later point"
}

// Haversine formula to calculate distance in meters
function haversineMeters(p1: TrackPoint, p2: TrackPoint): number {
    const R = 6371e3; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const lat1 = toRad(p1.lat);
    const lat2 = toRad(p2.lat);
    const dLat = toRad(p2.lat - p1.lat);
    const dLon = toRad(p2.lon - p1.lon);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export function parseGpx(xmlString: string): TrackPoint[] {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
    });
    const result = parser.parse(xmlString);

    if (!result.gpx || !result.gpx.trk) {
        throw new Error("Invalid GPX format");
    }

    // Handle multiple tracks or segments if necessary, but typically we flatten for merge
    // Supporting single track, multiple segments for now as common case
    const tracks = Array.isArray(result.gpx.trk) ? result.gpx.trk : [result.gpx.trk];
    const points: TrackPoint[] = [];

    for (const trk of tracks) {
        const trksegs = Array.isArray(trk.trkseg) ? trk.trkseg : [trk.trkseg];
        for (const seg of trksegs) {
            if (!seg.trkpt) continue;
            const trkpts = Array.isArray(seg.trkpt) ? seg.trkpt : [seg.trkpt];

            for (const pt of trkpts) {
                // Parse extensions
                let hr: number | undefined;
                let cad: number | undefined;
                let power: number | undefined;

                // Common extension structures (Garmin, Strava, etc.)
                // Example: <extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>120</...

                // Helper to find deep keys since XML parsers structure varies by schema usage
                const findKey = (obj: any, key: string): any => {
                    if (typeof obj !== 'object' || obj === null) return undefined;
                    if (key in obj) return obj[key];
                    for (const k of Object.keys(obj)) {
                        const found = findKey(obj[k], key);
                        if (found !== undefined) return found;
                    }
                    return undefined;
                };

                if (pt.extensions) {
                    hr = Number(findKey(pt.extensions, "hr") || findKey(pt.extensions, "gpxtpx:hr"));
                    cad = Number(findKey(pt.extensions, "cad") || findKey(pt.extensions, "gpxtpx:cad"));
                    // Power often in watt extension
                    power = Number(findKey(pt.extensions, "power") || findKey(pt.extensions, "watts")); // strava prefers 'watts' sometimes logic needed? keeping simple.
                }

                // Validate numbers
                if (isNaN(hr!)) hr = undefined;
                if (isNaN(cad!)) cad = undefined;
                if (isNaN(power!)) power = undefined;

                points.push({
                    lat: parseFloat(pt["@_lat"]),
                    lon: parseFloat(pt["@_lon"]),
                    ele: parseFloat(pt.ele),
                    time: new Date(pt.time),
                    hr,
                    cad,
                    power,
                });
            }
        }
    }

    return points;
}

export function mergeFragments(listOfPointArrays: TrackPoint[][], _policy?: MergePolicy): TrackPoint[] {
    // Flatten all lists
    let allPoints = listOfPointArrays.flat();

    // Sort by time
    allPoints.sort((a, b) => a.time.getTime() - b.time.getTime());

    if (allPoints.length === 0) return [];

    const merged: TrackPoint[] = [allPoints[0]];

    for (let i = 1; i < allPoints.length; i++) {
        const current = allPoints[i];
        const last = merged[merged.length - 1];

        const timeDiff = Math.abs(current.time.getTime() - last.time.getTime());
        const dist = haversineMeters(current, last);

        // Dedup rule: abs(time difference) <= 2 seconds AND haversine distance <= 8 meters
        if (timeDiff <= 2000 && dist <= 8) {
            // It's a duplicate, merge it into 'last'
            // Policy: prefer non-null, if both exist and differ, prefer later point (current)

            // Update last with extensions from current if valid
            if (current.hr !== undefined) last.hr = current.hr;
            if (current.cad !== undefined) last.cad = current.cad;
            if (current.power !== undefined) last.power = current.power;

            // We essentially "absorb" current into last. 
            // If we strictly followed "prefer later point" for core data (lat/lon/ele), we might replace 'last' with 'current'
            // but usually dedup implies keeping the existing one or taking the better one. 
            // The prompt says: "for extensions, choose non-null values; if both exist and differ, prefer the later point"
            // It doesn't explicitly say what to do with Lat/Lon/Ele. 
            // Usually, we keep the one already in the chain or average? 
            // "merged points sorted by time and de-duplicated" implies we keep one.
            // I will update the extensions on `last`.
            // NOTE: "prefer the later point" for extensions. `current` is later or equal (since sorted).
            // So if `last.hr` exists and `current.hr` exists, we overwrite `last.hr` with `current.hr`.

            // Re-evaluating text: "for extensions... prefer the later point"
            // Yes, current is later. So overwrite.
        } else {
            merged.push(current);
        }
    }

    return merged;
}

export function serializeGpx(points: TrackPoint[]): string {
    const gpxObj = {
        gpx: {
            "@_version": "1.1",
            "@_creator": "GPXForage",
            "@_xmlns": "http://www.topografix.com/GPX/1/1",
            "@_xmlns:gpxtpx": "http://www.garmin.com/xmlschemas/TrackPointExtension/v1",
            trk: {
                name: "Merged Track",
                trkseg: {
                    trkpt: points.map((p) => {
                        const pt: any = {
                            "@_lat": p.lat,
                            "@_lon": p.lon,
                            ele: p.ele,
                            time: p.time.toISOString(),
                        };

                        const extensions: any = {};
                        let hasExtensions = false;

                        if (p.hr !== undefined || p.cad !== undefined || p.power !== undefined) {
                            const tpx: any = {};
                            if (p.hr !== undefined) tpx["gpxtpx:hr"] = p.hr;
                            if (p.cad !== undefined) tpx["gpxtpx:cad"] = p.cad;
                            // Power typically not in standard Garmin TPX v1 but often added similarly or in separate namespace
                            // Ideally we use proper schema but for generic valid GPX we can try structure it safely
                            // For this exercise, I'll put power in tpx if keys allow or separate?
                            // Standard: http://www.garmin.com/xmlschemas/TrackPointExtension/v1 does not have power.
                            // But Strava uses <power> sometimes? Or <extensions><power>
                            // Let's stick to standard TPX for hr/cad. 
                            // For Power, I'll add a simple <power> tag inside extensions for broad compatibility if not strict schema.

                            if (Object.keys(tpx).length > 0) {
                                extensions["gpxtpx:TrackPointExtension"] = tpx;
                                hasExtensions = true;
                            }

                            if (p.power !== undefined) {
                                extensions["power"] = p.power;
                                hasExtensions = true;
                            }
                        }

                        if (hasExtensions) {
                            pt.extensions = extensions;
                        }

                        return pt;
                    }),
                },
            },
        },
    };

    const builder = new XMLBuilder({
        ignoreAttributes: false,
        format: true,
    });

    return `<?xml version="1.0" encoding="UTF-8"?>\n${builder.build(gpxObj)}`;
}

export function mergeGpxFiles(fileContents: string[]): string {
    const fragments = fileContents.map((content) => parseGpx(content));
    const mergedPoints = mergeFragments(fragments);
    return serializeGpx(mergedPoints);
}
