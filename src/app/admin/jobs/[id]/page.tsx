"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, PlayCircle, Download } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminJobDetailsPage() {
    const { id } = useParams() as { id: string };
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [rerunning, setRerunning] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                // Reuse the same public API for details, or strictly use admin one if needed.
                // For simplicity, let's just fetch from the public one since we are admin anyway,
                // BUT the public one checks userId. So we need an admin-specific fetch or reuse the list endpoint.
                // Actually, the public GET /api/merge-jobs/[id] likely checks 'OR role=admin'. 
                // Let's verify that later. For now, let's assume I need to fetch from the list or add a get-one endpoint.
                // Wait, I didn't add a GET-ONE admin endpoint. 
                // Let's just fetch the public one and hope I configured it to allow admins (I checked, it checks ownership OR admin).

                const res = await fetch(`/api/merge-jobs/${id}`);
                if (!res.ok) throw new Error("Failed to load");
                const data = await res.json();
                setJob(data);
            } catch (e) {
                console.error(e);
                toast.error("Could not load job details");
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id]);

    const handleRerun = async () => {
        setRerunning(true);
        try {
            const res = await fetch(`/api/admin/jobs/${id}/rerun`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setJob((prev: any) => ({ ...prev, status: data.job.status }));
                toast.success("Job triggered for rerun (Mocked)");
            } else {
                toast.error("Failed to trigger rerun");
            }
        } catch (e) {
            toast.error("Error triggering rerun");
        } finally {
            setRerunning(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    if (!job) return <div>Job not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/jobs">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="size-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Admin: Job Details</h1>
                    <div className="text-sm font-mono text-muted-foreground">{id}</div>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button onClick={handleRerun} disabled={rerunning || job.status === 'PROCESSING'}>
                        {rerunning ? <Loader2 className="animate-spin mr-2" /> : <PlayCircle className="mr-2" />}
                        Rerun Processing
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="grid grid-cols-3 text-sm">
                            <span className="font-semibold text-muted-foreground">Status</span>
                            <span className="col-span-2">
                                <Badge variant={job.status === 'COMPLETED' ? 'default' : 'secondary'}>{job.status}</Badge>
                            </span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                            <span className="font-semibold text-muted-foreground">Title</span>
                            <span className="col-span-2">{job.title}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                            <span className="font-semibold text-muted-foreground">User ID</span>
                            <span className="col-span-2 font-mono text-xs">{job.userId}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                            <span className="font-semibold text-muted-foreground">Created</span>
                            <span className="col-span-2">{new Date(job.createdAt).toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Files</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <h4 className="font-semibold mb-2">Fragments</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mb-4">
                            {job.fragmentFiles?.map((f: any) => (
                                <li key={f.id} className="truncate">
                                    {f.originalFilename} <span className="text-xs font-mono">({f.id.slice(-4)})</span>
                                </li>
                            ))}
                        </ul>

                        <h4 className="font-semibold mb-2">Output</h4>
                        {job.outputFiles?.length > 0 ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-green-600">Generated successfully</span>
                                <a href={job.outputFiles[0].url} download>
                                    <Button size="sm" variant="outline">
                                        <Download className="mr-2 size-4" /> Download
                                    </Button>
                                </a>
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground">No output generated yet.</span>
                        )}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 bg-neutral-950 text-neutral-50">
                    <CardHeader>
                        <CardTitle>Debug Logs</CardTitle>
                    </CardHeader>
                    <CardContent className="font-mono text-xs overflow-x-auto">
                        <pre>{JSON.stringify(job, null, 2)}</pre>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
