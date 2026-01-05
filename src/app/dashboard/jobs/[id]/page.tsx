"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Play, Download, MapPin, FileText } from "lucide-react";
import UploadDropzone from "@/components/UploadDropzone";
import MapPreview from "@/components/MapPreview";
import { toast } from "sonner";

export default function JobWorkspacePage() {
    const { id } = useParams();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [merging, setMerging] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refresh = () => setRefreshTrigger(p => p + 1);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/merge-jobs/${id}`)
            .then(r => {
                if (r.ok) return r.json();
                throw new Error('Failed to load job');
            })
            .then(data => setJob(data))
            .catch(e => toast.error("Could not load job"))
            .finally(() => setLoading(false));
    }, [id, refreshTrigger]);

    const runMerge = async () => {
        setMerging(true);
        try {
            const res = await fetch(`/api/merge-jobs/${id}/run`, { method: 'POST' });
            if (!res.ok) throw new Error('Merge failed');
            toast.success("Merge complete!");
            refresh();
        } catch (e) {
            toast.error("Merge failed to start");
        } finally {
            setMerging(false);
        }
    };

    const downloadMerged = async () => {
        try {
            const res = await fetch(`/api/merge-jobs/${id}/download`);
            if (!res.ok) throw new Error("No download available");
            const { url } = await res.json();
            window.location.href = url;
        } catch (e) {
            toast.error("Download failed");
        }
    }

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!job) return <div className="p-12 text-center">Job not found</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Merge Job #{job.id.slice(0, 6)}
                        <Badge variant={job.status === 'COMPLETED' ? "default" : "secondary"}>
                            {job.status}
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground text-sm">Created {new Date(job.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                    {job.fragments?.length > 0 && job.status !== 'COMPLETED' && (
                        <Button onClick={runMerge} disabled={merging}>
                            {merging ? <Loader2 className="animate-spin mr-2 size-4" /> : <Play className="mr-2 size-4" />}
                            Run Merge
                        </Button>
                    )}
                    {job.status === 'COMPLETED' && (
                        <Button onClick={downloadMerged} variant="default" className="bg-green-600 hover:bg-green-700">
                            <Download className="mr-2 size-4" /> Download GPX
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Left Col: Upload & Fragments */}
                <div className="md:col-span-1 space-y-6">
                    {job.status !== 'COMPLETED' && (
                        <Card>
                            <CardHeader><CardTitle className="text-base">Upload Fragments</CardTitle></CardHeader>
                            <CardContent>
                                <UploadDropzone jobId={job.id} onUploadComplete={refresh} />
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader><CardTitle className="text-base">Fragments ({job.fragments?.length || 0})</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {job.fragments?.map((f: any, i: number) => (
                                <div key={f.id} className="flex items-center gap-2 text-sm p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                                    <div className="size-6 bg-white dark:bg-neutral-700 rounded flex items-center justify-center font-mono text-xs">
                                        {i + 1}
                                    </div>
                                    <span className="truncate flex-1">{f.originalName}</span>
                                    <Badge variant="outline" className="text-xs">GPX</Badge>
                                </div>
                            ))}
                            {(!job.fragments || job.fragments.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">No fragments uploaded yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Col: Preview */}
                <div className="md:col-span-2">
                    <Card className="h-[600px] flex flex-col">
                        <CardHeader className="py-4 border-b">
                            <CardTitle className="text-base flex items-center gap-2"><MapPin className="size-4" /> Map Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 relative bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                            {job.status === 'COMPLETED' ? (
                                <MapPreview gpxUrl={`/api/merge-jobs/${job.id}/download`} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <div className="text-center">
                                        <MapPin className="size-10 mx-auto mb-2 opacity-50" />
                                        <p>Map available after merge</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
