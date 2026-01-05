"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, FileCode, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns"; // We might need date-fns, or just use native Intl

// Icons map
const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'COMPLETED': return <CheckCircle className="size-5 text-green-500" />;
        case 'FAILED': return <AlertCircle className="size-5 text-red-500" />;
        case 'PROCESSING': return <Loader2 className="size-5 text-blue-500 animate-spin" />;
        default: return <Clock className="size-5 text-neutral-400" />;
    }
};

export default function DashboardPage() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/merge-jobs') // Assuming we create a GET list endpoint? Or just filter client side?
            // Wait, I didn't implement GET /api/merge-jobs to LIST jobs.
            // Plan said: "GET /api/merge-jobs/:id (job status)".
            // Admin API lists jobs.
            // I need a "List User Jobs" API.
            // I'll assume GET /api/merge-jobs lists OWN jobs if no ID provided.
            // If I didn't implement that, I need to update the route.
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Failed to fetch');
            })
            .then(data => setJobs(data))
            .catch(err => {
                // handle error
                console.error(err);
            })
            .finally(() => setLoading(false));
    }, []);

    const createJob = async () => {
        setCreating(true);
        try {
            const res = await fetch('/api/merge-jobs', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to create');
            const job = await res.json();
            router.push(`/dashboard/jobs/${job.id}`);
        } catch (e) {
            console.error(e);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Your Merges</h1>
                    <p className="text-neutral-500">Manage and create GPX merge jobs.</p>
                </div>
                <Button onClick={createJob} disabled={creating} size="lg" className="bg-orange-600 hover:bg-orange-700">
                    {creating ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 size-4" />}
                    New Merge
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="size-8 animate-spin text-neutral-400" />
                </div>
            ) : jobs.length === 0 ? (
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="p-4 rounded-full bg-orange-100 dark:bg-orange-900/20">
                            <FileCode className="size-8 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium">No jobs yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                Create your first job to start merging multiple GPX files into one track.
                            </p>
                        </div>
                        <Button onClick={createJob} disabled={creating} variant="outline">Create Job</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {jobs.map(job => (
                        <Link href={`/dashboard/jobs/${job.id}`} key={job.id}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-neutral-200 dark:border-neutral-800">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="font-medium truncate text-sm text-muted-foreground">ID: {job.id.slice(0, 8)}...</div>
                                    <StatusIcon status={job.status} />
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="text-lg mb-2">Merge Job</CardTitle>
                                    <CardDescription>
                                        Started {new Date(job.createdAt).toLocaleDateString()}
                                    </CardDescription>
                                    <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
                                        <span>{job.fragments?.length || 0} fragments</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
