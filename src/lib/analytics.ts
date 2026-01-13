import { db } from "@/lib/db";

export type EventType =
    | "LOGIN"
    | "UPLOAD"
    | "MERGE_CREATED"
    | "MERGE_COMPLETED"
    | "MERGE_FAILED";

interface AnalyticsMeta {
    [key: string]: any;
}

/**
 * Tracks an analytics event in the database.
 */
export async function trackEvent(userId: string | null, eventType: EventType, meta?: AnalyticsMeta) {
    try {
        await db.analyticsEvent.create({
            data: {
                userId,
                eventType,
                meta: meta || {},
            }
        });
    } catch (e) {
        console.error("Failed to track analytics event:", e);
    }
}
