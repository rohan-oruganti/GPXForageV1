"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, FileStack, CheckCircle, Clock } from "lucide-react";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts"; // Client Chart
import UsersTable from "@/components/admin/UsersTable";
import dynamic from "next/dynamic";

// Dynamic import for Leaflet map to avoid SSR issues
const AnalyticsMap = dynamic(() => import("@/components/admin/AnalyticsMap"), { ssr: false, loading: () => <div className="h-full w-full bg-muted animate-pulse" /> });

export default function AdminAnalyticsPage() {
    const [summary, setSummary] = useState<any>(null);
    const [chartsData, setChartsData] = useState<any[]>([]);
    const [mapData, setMapData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState(30);

    const refresh = async () => {
        setLoading(true);
        try {
            const [sumRes, chartRes, mapRes] = await Promise.all([
                fetch(`/api/admin/analytics/summary?days=${range}`),
                fetch(`/api/admin/analytics/charts?days=${range}`),
                fetch(`/api/admin/analytics/map?days=${range}`)
            ]);

            setSummary(await sumRes.json());
            const chartJson = await chartRes.json();
            setChartsData(chartJson.activity || []);
            setMapData(await mapRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, [range]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Users & Analytics</h2>
                    <p className="text-muted-foreground">Monitor adoption, job activity, and user growth.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        value={range}
                        onChange={(e) => setRange(parseInt(e.target.value))}
                    >
                        <option value={7}>Last 7 Days</option>
                        <option value={30}>Last 30 Days</option>
                        <option value={90}>Last 3 Months</option>
                    </select>
                    <Button onClick={refresh} variant="outline" size="sm">
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.users?.active ?? '-'}</div>
                        <p className="text-xs text-muted-foreground">
                            {summary?.users?.new ?? 0} new in this period
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Files Processed</CardTitle>
                        <FileStack className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.jobs?.total ?? '-'}</div>
                        <p className="text-xs text-muted-foreground">
                            {summary?.jobs?.inRange ?? 0} jobs in this period
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.jobs?.successRate ?? 0}%</div>
                        <p className="text-xs text-muted-foreground">
                            {summary?.jobs?.completed ?? 0} completed successfully
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.jobs?.avgDurationSec ?? 0}s</div>
                        <p className="text-xs text-muted-foreground">
                            Per completed merge job
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Map Grid */}
            <div className="grid gap-6 md:grid-cols-7">
                <div className="col-span-4">
                    {/* Charts Component */}
                    <AnalyticsCharts data={chartsData} />
                </div>
                <div className="col-span-3">
                    <Card className="h-full min-h-[400px]">
                        <CardHeader>
                            <CardTitle>User Locations</CardTitle>
                            <CardDescription>Privacy-safe aggregation by country.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px] p-0 relative overflow-hidden rounded-b-md">
                            <AnalyticsMap data={mapData} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* User Directory */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">User Directory</h3>
                <UsersTable />
            </div>

        </div>
    );
}
