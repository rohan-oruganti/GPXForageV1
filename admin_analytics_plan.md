# Admin Analytics & Settings Implementation Plan

## 1. Wire Layout

### **A. Users Tab (Analytics Dashboard) - `/admin/users`**
*   **Header:** Title "Users & Analytics" | Date Range Picker (Last 7/30/90d) | "Refresh" Button.
*   **Section 1: KPI Cards (Grid of 4-6)**
    *   *Monthly Active Users (MAU)*
    *   *Total Files Merged*
    *   *Merge Success Rate (%)*
    *   *Avg Merge Duration*
*   **Section 2: Charts (2 Columns)**
    *   *Left:* "Activity Over Time" (Line Chart: Merges vs Uploads)
    *   *Right:* "Merge Job Outcomes" (Stacked Bar: Completed vs Failed)
*   **Section 3: Geographic Distribution**
    *   *Card:* "User Locations (Privacy-Safe)"
    *   *Content:* Leaflet Map with coarse-location Heatmap/Clusters.
*   **Section 4: User Directory**
    *   *Full-width Table:* Searchable Users list.
    *   *Columns:* Email, Role, Last Active, Total Merges, Actions (View Details).

### **B. Settings Tab - `/admin/settings`**
*   **Card 1: Analytics Config** (Retention policy, toggle tracking).
*   **Card 2: Job Limits** (Max file size, max fragments).
*   **Card 3: Security** (Session timeouts - display only).

## 2. KPIs & Definitions
*   **New Users:** Count of users created within the selected date range.
*   **Active Users:** Count of unique `userId`s logging at least one `AnalyticsEvent` in range.
*   **Merge Success Rate:** `(Completed Jobs / Total Jobs) * 100`.
*   **Avg Duration:** Average of `(finishedAt - createdAt)` for completed jobs.

## 3. Schema Changes (Prisma)
New model to track granular events:
```prisma
model AnalyticsEvent {
  id        String   @id @default(cuid())
  userId    String?  // Nullable to track anon events or if user deleted
  eventType String   // e.g., "LOGIN", "UPLOAD", "MERGE_START", "MERGE_COMPLETE"
  meta      Json?    // e.g., { "country": "US", "fileCount": 5, "durationMs": 1200 }
  createdAt DateTime @default(now())

  user      User?    @relation(fields: [userId], references: [id])
}
```

## 4. API Endpoints (Admin Only)
*   **`GET /api/admin/analytics/summary`**: Returns aggregated KPIs for the date range.
*   **`GET /api/admin/analytics/charts`**: Returns time-series data for recharts.
*   **`GET /api/admin/analytics/map`**: Returns aggregated country/region counts.
*   **`GET /api/admin/users`**: Paginated list of users with computed stats.

## 5. Privacy-Safe Geo-Tracking
*   **Collection:** On key events (Login/Merge), server extracts `country` and `region` from request IP (using external free API or headers).
*   **Storage:** We do **NOT** store the IP. We only store the `country` Code (e.g., "US", "DE") in `AnalyticsEvent.meta`.
*   **Display:** The map aggregates these counts. Just "15 users in US", not precise locations.

## 6. Implementation Steps
1.  **Dependencies:** Install `recharts` for charts. (Map uses existing `react-leaflet`).
2.  **Database:** Update `schema.prisma` and run `prisma migrate`.
3.  **Backend Instrumentation:**
    *   Create `lib/analytics.ts` -> `trackEvent(userId, type, meta)`.
    *   Call `trackEvent` in `api/merge-jobs` (create/complete) and dashboard loading (login/active).
4.  **Admin API:** Create the 4 new endpoints in `src/app/api/admin/...`.
5.  **Frontend:**
    *   Update `admin/layout.tsx` to link to new pages.
    *   Build `/admin/users/page.tsx` with Recharts and Leaflet.
    *   Build `/admin/settings/page.tsx`.
