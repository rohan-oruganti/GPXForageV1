"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Download, Layers, PlayCircle, Pencil, Trash2, Eye, Copy, Check, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// Dynamically import MapComponent to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-secondary/20"><Loader2 className="animate-spin" /></div>
});

export default function JobDetailsPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [merging, setMerging] = useState(false);

    // Rename state
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [newTitle, setNewTitle] = useState("");

    // Preview state
    const [previewContent, setPreviewContent] = useState("");
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchJob = async () => {
            try {
                const res = await fetch(`/api/merge-jobs/${id}`);
                if (!res.ok) throw new Error("Failed to load");
                const data = await res.json();
                setJob(data);
                if (!newTitle && data.title) setNewTitle(data.title); // Only set if empty

                // Stop polling if complete or failed
                if (data.status === 'COMPLETED' || data.status === 'FAILED') {
                    if (intervalId) clearInterval(intervalId);
                }
            } catch (e) {
                console.error(e);
                // Don't toast on poll fail to avoid spam
            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        fetchJob();

        // Setup polling
        intervalId = setInterval(() => {
            // Only poll if we have a job and it's not done
            setJob((prev: any) => {
                if (prev && (prev.status === 'COMPLETED' || prev.status === 'FAILED')) {
                    clearInterval(intervalId);
                    return prev;
                }
                // Trigger fetch if not done
                fetchJob();
                return prev;
            });
        }, 2000);

        return () => clearInterval(intervalId);
    }, [id]);

    const handleMerge = async () => {
        setMerging(true);
        try {
            const res = await fetch(`/api/merge-jobs/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'MERGE' })
            });
            if (res.ok) {
                const updatedJob = await res.json();
                setJob(updatedJob);
                toast.success("Merge complete!");
            } else {
                throw new Error("Merge failed");
            }
        } catch (e) {
            toast.error("Failed to merge");
        } finally {
            setMerging(false);
        }
    };

    const handleRename = async () => {
        try {
            const res = await fetch(`/api/merge-jobs/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });
            if (res.ok) {
                const updated = await res.json();
                setJob((prev: any) => ({ ...prev, title: updated.title }));
                setIsEditingTitle(false);
                toast.success("Renamed!");
            }
        } catch (e) {
            toast.error("Rename failed");
        }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/merge-jobs/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success("Route deleted");
                router.push('/dashboard');
            } else {
                throw new Error("Failed to delete");
            }
        } catch (e) {
            toast.error("Could not delete route");
        }
    };

    const handlePreview = async () => {
        if (!mergedUrl) return;
        setLoadingPreview(true);
        try {
            const res = await fetch(mergedUrl);
            if (!res.ok) throw new Error("Failed to fetch GPX");
            const text = await res.text();
            setPreviewContent(text);
        } catch (e) {
            toast.error("Could not load GPX content");
        } finally {
            setLoadingPreview(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(previewContent);
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="size-10 animate-spin text-primary" /></div>;
    if (!job) return <div>Job not found</div>;

    const fragments = job.fragmentFiles || [];
    const outputs = job.outputFiles || [];
    const mergedUrl = outputs.length > 0 ? outputs[0].url : null;

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="size-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            {isEditingTitle ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        className="text-2xl font-bold bg-transparent border-b border-primary focus:outline-none"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        autoFocus
                                    />
                                    <Button size="sm" onClick={handleRename}>Save</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)}>Cancel</Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group">
                                    <h1 className="text-2xl font-bold">{job.title || "Untitled Route"}</h1>
                                    <button onClick={() => setIsEditingTitle(true)} className="text-muted-foreground hover:text-primary transition-colors">
                                        <Pencil className="size-4" />
                                    </button>
                                </div>
                            )}
                            <Badge variant={job.status === 'COMPLETED' ? 'default' : 'secondary'}>{job.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">ID: {job.id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Delete Button */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors">
                                <Trash2 className="size-5" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete this route?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your route and all associated files.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Actions */}
                    {job.status === 'COMPLETED' && mergedUrl ? (
                        <div className="flex gap-2">
                            {/* Preview Button */}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" onClick={handlePreview}>
                                        <Eye className="mr-2 size-4" /> Preview
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center justify-between">
                                            <span>GPX File Content</span>
                                            <Button size="sm" variant="ghost" onClick={copyToClipboard}>
                                                {copied ? <Check className="size-4 mr-1" /> : <Copy className="size-4 mr-1" />}
                                                {copied ? "Copied" : "Copy"}
                                            </Button>
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="flex-1 overflow-auto bg-muted p-4 rounded-md border text-xs font-mono whitespace-pre-wrap">
                                        {loadingPreview ? (
                                            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                                        ) : (
                                            previewContent || "No content loaded."
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <a href={mergedUrl} download={`merged-${job.id}.gpx`}>
                                <Button className="shadow-lg shadow-primary/20" variant="default">
                                    <Download className="mr-2 size-4" /> Download GPX
                                </Button>
                            </a>
                        </div>
                    ) : (
                        <Button onClick={handleMerge} disabled={merging || job.status === 'COMPLETED'} className="shadow-lg">
                            {merging ? <Loader2 className="animate-spin mr-2" /> : <PlayCircle className="mr-2 size-4" />}
                            {job.status === 'COMPLETED' ? 'Processing...' : 'Merge Fragments'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Left: Sidebar (Fragments & Stats) */}
                <Card className="lg:col-span-1 flex flex-col h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-3 shrink-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Layers className="size-5 text-primary" />
                            Fragments
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {fragments.map((f: any, i: number) => (
                            <div key={f.id} className="p-3 rounded-lg border border-border/50 bg-secondary/20 text-sm">
                                <div className="font-medium truncate mb-1" title={f.originalFilename}>{f.originalFilename}</div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <div className="size-3 rounded-full" style={{ backgroundColor: getColor(i) }} />
                                        <span>Segment {i + 1}</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Route Photos Section */}
                        {job.routeImages && job.routeImages.length > 0 && (
                            <div className="pt-4 mt-4 border-t border-border/50">
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <ImageIcon className="size-4 text-primary" />
                                    Route Photos
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {job.routeImages.map((img: any) => (
                                        <Dialog key={img.id}>
                                            <DialogTrigger asChild>
                                                <div className="relative aspect-square rounded-md overflow-hidden border border-border/50 cursor-pointer hover:opacity-90 transition-opacity bg-neutral-100 dark:bg-neutral-800">
                                                    <Image
                                                        src={img.url}
                                                        alt="Route photo"
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-transparent shadow-none">
                                                <div className="relative w-full h-[80vh] pointer-events-auto">
                                                    <Image
                                                        src={img.url}
                                                        alt="Route photo full"
                                                        fill
                                                        className="object-contain"
                                                        unoptimized
                                                    />
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right: Map */}
                <div className="lg:col-span-2 h-full rounded-2xl overflow-hidden border border-border bg-neutral-100 dark:bg-neutral-800 relative shadow-inner">
                    <MapComponent
                        fragments={fragments}
                        mergedUrl={mergedUrl}
                    />
                </div>
            </div>
        </div>
    );
}

// Simple color cycler for consistent UI
function getColor(index: number) {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
}
