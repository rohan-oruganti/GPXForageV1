import { mergeFragments, TrackPoint } from "./gpx";

// Mock helpers
const createPoint = (
    timeOffsetSec: number,
    lat: number = 10,
    lon: number = 10,
    ext: Partial<TrackPoint> = {}
): TrackPoint => ({
    lat,
    lon,
    ele: 100,
    time: new Date(new Date("2023-01-01T10:00:00Z").getTime() + timeOffsetSec * 1000),
    ...ext
});

// Test Cases
async function runTests() {
    console.log("Running GPX Merge Tests...");

    // Case 1: No Overlap
    // Fragment A: 0s, 3s, 6s (spaced > 2s to prevent self-merge)
    // Fragment B: 20s, 23s, 26s
    const frag1 = [createPoint(0), createPoint(3), createPoint(6)];
    const frag2 = [createPoint(20), createPoint(23), createPoint(26)];

    const result1 = mergeFragments([frag1, frag2]);
    if (result1.length === 6) {
        console.log("✅ Case 1: No Overlap passed");
    } else {
        console.error("❌ Case 1: Failed. Expected 6 points, got " + result1.length);
    }

    // Case 2: Time Overlap (Exact duplicates / close time)
    // Fragment A: 0s, 3s, 6s
    // Fragment B: 6s (overlaps last of A), 9s
    // Should merge the 6s point
    const frag3 = [createPoint(0), createPoint(3), createPoint(6, 10, 10, { hr: 100 })];
    const frag4 = [createPoint(6, 10, 10, { hr: 110, cad: 80 }), createPoint(9)];

    const result2 = mergeFragments([frag3, frag4]);
    // Expected: 0, 3, 6(merged), 9. Length 4.
    // Merged 6s point should have hr=110, cad=80

    const mergedPoint = result2.find(p => Math.abs(p.time.getTime() - new Date("2023-01-01T10:00:06Z").getTime()) < 100);

    if (
        result2.length === 4 &&
        mergedPoint &&
        mergedPoint.hr === 110 &&
        mergedPoint.cad === 80
    ) {
        console.log("✅ Case 2: Time Overlap passed");
    } else {
        console.error("❌ Case 2: Failed.");
        console.log("Length:", result2.length);
        console.log("Merged Point:", mergedPoint);
    }

    // Case 3: GPS Overlap (Close enough to dedup)
    // Time diff 1.5s, Dist < 8m
    // Point A at t=0
    // Point B at t=1.5s, moved 0.00001 degrees lat (approx 1.1m)
    const pA = createPoint(0, 10.00000, 10.00000);
    const pB = createPoint(1.5, 10.00001, 10.00000); // 1.11m away

    // Note: pB is 1.5s after pA. 
    // If we merge fragments [pA] and [pB], they are sorted: pA, pB.
    // diff = 1.5s <= 2s. dist = 1.1m <= 8m.
    // result: 1 point (pB merged into pA or vice versa).

    const result3 = mergeFragments([[pA], [pB]]);

    if (result3.length === 1) {
        console.log("✅ Case 3: GPS Overlap passed (deduplicated close points)");
    } else {
        console.error("❌ Case 3: Failed. Expected 1 point, got " + result3.length);
        console.log("Dist check: ", result3);
    }
}

runTests().catch(console.error);
