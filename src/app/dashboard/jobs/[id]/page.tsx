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
                        Route Compilation #{job.id.slice(0, 6)}
                        <Badge variant={job.status === 'COMPLETED' ? "default" : "secondary"}>
                            {job.status === 'PROCESSING' ? 'STITCHING' : job.status}
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground text-sm">Created {new Date(job.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                    {job.fragments?.length > 0 && job.status !== 'COMPLETED' && (
                        <Button onClick={runMerge} disabled={merging} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {merging ? <Loader2 className="animate-spin mr-2 size-4" /> : <Play className="mr-2 size-4" />}
                            Stitch Tracks
                        </Button>
                    )}
                    {job.status === 'COMPLETED' && (
                        <Button onClick={downloadMerged} variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:scale-105 transition-transform">
                            <Download className="mr-2 size-4" /> Download Route
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Left Col: Upload & Fragments */}
                <div className="md:col-span-1 space-y-6">
                    {job.status !== 'COMPLETED' && (
                        <Card className="bg-card border-dashed border-2 border-border/60 hover:border-primary/40 transition-colors">
                            <CardHeader><CardTitle className="text-base text-foreground">Add Track Segments</CardTitle></CardHeader>
                            <CardContent>
                                <UploadDropzone jobId={job.id} onUploadComplete={refresh} />
                            </CardContent>
                        </Card>
                    )}

                    <Card className="bg-card">
                        <CardHeader><CardTitle className="text-base text-card-foreground">Track Segments ({job.fragments?.length || 0})</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {job.fragments?.map((f: any, i: number) => (
                                <div key={f.id} className="flex items-center gap-2 text-sm p-3 bg-secondary/50 rounded-lg border border-border/50">
                                    <div className="size-6 bg-background rounded flex items-center justify-center font-mono text-xs font-bold text-muted-foreground border">
                                        {i + 1}
                                    </div>
                                    <span className="truncate flex-1 text-foreground font-medium">{f.originalName}</span>
                                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">GPX</Badge>
                                </div>
                            ))}
                            {(!job.fragments || job.fragments.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4 italic">No tracks uploaded yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Col: Preview */}
                <div className="md:col-span-2">
                    <Card className="h-[600px] flex flex-col bg-card overflow-hidden border-border/50 relative group">
                        <CardHeader className="py-4 border-b border-border/50 bg-background/50 backdrop-blur z-10 absolute w-full">
                            <CardTitle className="text-base flex items-center gap-2 text-foreground"><MapPin className="size-4 text-primary" /> Route Visualization</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 relative bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                            {job.status === 'COMPLETED' ? (
                                <MapPreview gpxUrl={`/api/merge-jobs/${job.id}/download`} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground bg-secondary/20">
                                    <div className="text-center p-8 rounded-2xl bg-background/80 backdrop-blur border border-border/50 shadow-sm">
                                        <MapPin className="size-12 mx-auto mb-4 text-primary/40" />
                                        <h3 className="text-lg font-bold text-foreground">No Route Preview</h3>
                                        <p className="text-sm">Upload and stitch your tracks to see the route here.</p>
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
