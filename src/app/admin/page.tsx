"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
    const { user, isLoading } = useUser();
    const [stats, setStats] = useState<any>(null);

    // This is a placeholder for actual admin data fetching.
    // Ideally we'd have a specific admin endpoint.

    if (isLoading) return <Loader2 className="animate-spin" />;

    // Simple role check on frontend (backend must verify too)
    // Note: Auth0 user object might not have 'role' unless added to token / rules.
    // For now we trust backend 403.

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle>Users</CardTitle></CardHeader>
                    <CardContent>
                        <p>User management coming soon.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>System Jobs</CardTitle></CardHeader>
                    <CardContent>
                        <p>Global job list coming soon.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
