import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export function mergeGpxFiles(contents: string[]): string {
    if (contents.length === 0) return '';

    const options = {
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        isArray: (name: string) => ['trk', 'rte', 'wpt', 'trkseg', 'trkpt'].includes(name)
    };
    const parser = new XMLParser(options);
    const builder = new XMLBuilder({ ...options, format: true, suppressBooleanAttributes: false });

    const parsedFiles = contents.map(c => parser.parse(c));

    // Use metadata from first file as base
    const result = parsedFiles[0];

    // Ensure arrays exist
    if (!result.gpx) result.gpx = {};
    if (!result.gpx.trk) result.gpx.trk = [];
    if (!result.gpx.wpt) result.gpx.wpt = [];
    if (!result.gpx.rte) result.gpx.rte = [];

    // Merge tracks, waypoints, routes from subsequent files
    for (let i = 1; i < parsedFiles.length; i++) {
        const current = parsedFiles[i];
        if (current.gpx.trk) result.gpx.trk.push(...current.gpx.trk);
        if (current.gpx.wpt) result.gpx.wpt.push(...current.gpx.wpt);
        if (current.gpx.rte) result.gpx.rte.push(...current.gpx.rte);
    }

    return builder.build(result);
}
