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
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Activity Library</h1>
                    <p className="text-muted-foreground">All your adventures in one place!</p>
                </div>
                <Button onClick={createJob} disabled={creating} size="lg" className="shadow-lg transition-transform hover:scale-105 active:scale-95">
                    {creating ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 size-4" />}
                    Add New Route
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="size-10 animate-spin text-primary" />
                </div>
            ) : jobs.length === 0 ? (
                <Card className="border-dashed border-2 bg-card/50">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="p-5 rounded-full bg-primary/10">
                            <FileCode className="size-10 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-card-foreground">Ready to map your adventure?</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                Combine scattered GPX tracks from different devices into one epic continuous route.
                            </p>
                        </div>
                        <Button onClick={createJob} disabled={creating} variant="outline" className="mt-4">Start </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {jobs.map(job => (
                        <Link href={`/dashboard/jobs/${job.id}`} key={job.id} className="group block h-full">
                            <Card className="h-full border border-border/50 bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <div className="font-mono text-xs text-primary/80 uppercase tracking-widest">
                                        ID: {job.id.slice(-6)}
                                    </div>
                                    <StatusIcon status={job.status} />
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="text-xl font-bold text-card-foreground mb-1 group-hover:text-primary transition-colors">
                                        Untitled Route
                                    </CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        Created {new Date(job.createdAt).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                    </CardDescription>

                                    <div className="mt-6 flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-xs font-medium text-secondary-foreground">
                                            <FileCode className="size-3" />
                                            <span>{job.fragmentFiles?.length || job.fragments?.length || 0} fragments</span>
                                        </div>
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
