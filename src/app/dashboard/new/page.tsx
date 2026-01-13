"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadCloud, FileCode, CheckCircle, X, Loader2, ArrowRight, Route, Image as ImageIcon, Trash2, Maximize2 } from "lucide-react";
import { parseGpx, TrackPoint } from "@/lib/gpx";
import { toast } from "sonner";
import Image from "next/image";

interface FileStat {
    file: File;
    points: number;
    distance: number;
}

interface ImagePayload {
    file: File;
    preview: string;
}

export default function NewJobPage() {
    const { user, isLoading: userLoading } = useUser();
    const [dragging, setDragging] = useState(false); // GPX dragging
    const [imgDragging, setImgDragging] = useState(false); // Image dragging
    const [fileStats, setFileStats] = useState<FileStat[]>([]);
    const [imageFiles, setImageFiles] = useState<ImagePayload[]>([]);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files) return;
        const newStats: FileStat[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.name.endsWith('.gpx')) continue;

            try {
                const text = await file.text();
                const points = parseGpx(text);

                // Calculate distance
                let dist = 0;
                for (let j = 0; j < points.length - 1; j++) {
                    dist += haversineMeters(points[j], points[j + 1]);
                }

                newStats.push({ file, points: points.length, distance: dist });
            } catch (e) {
                console.error("Error parsing", file.name, e);
                toast.error(`Failed to parse ${file.name}`);
            }
        }
        setFileStats(prev => [...prev, ...newStats]);
    }, []);

    const handleImages = useCallback((files: FileList | null) => {
        if (!files) return;
        const newImages: ImagePayload[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Simple type check
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image`);
                continue;
            }
            // Create object URL for preview
            const preview = URL.createObjectURL(file);
            newImages.push({ file, preview });
        }
        setImageFiles(prev => [...prev, ...newImages]);
    }, []);

    // Helper for distance
    const haversineMeters = (p1: TrackPoint, p2: TrackPoint) => {
        const R = 6371e3;
        const toRad = (d: number) => d * Math.PI / 180;
        const dLat = toRad(p2.lat - p1.lat);
        const dLon = toRad(p2.lon - p1.lon);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const handleCreate = async () => {
        if (fileStats.length === 0) return;
        setUploading(true);

        try {
            // 1. Create Job
            const jobRes = await fetch('/api/merge-jobs', { method: 'POST' });
            if (!jobRes.ok) {
                const err = await jobRes.text();
                throw new Error(`Create Job Failed: ${jobRes.status} ${err}`);
            }
            const job = await jobRes.json();
            const jobId = job.id;

            // 2. Upload GPX Files
            if (fileStats.length > 0) {
                const fileData = fileStats.map(f => ({ name: f.file.name, size: f.file.size }));
                const presignRes = await fetch(`/api/merge-jobs/${jobId}/fragments/presign`, {
                    method: 'POST',
                    body: JSON.stringify({ files: fileData })
                });
                if (!presignRes.ok) throw new Error("GPX Presign Failed");
                const presigned = await presignRes.json();

                await Promise.all(presigned.map(async (p: any, i: number) => {
                    await fetch(p.url, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/gpx+xml' },
                        body: fileStats[i].file
                    });
                }));
            }

            // 3. Upload Images
            if (imageFiles.length > 0) {
                const imgData = imageFiles.map(img => ({
                    name: img.file.name,
                    size: img.file.size,
                    type: img.file.type
                }));
                const imgPresignRes = await fetch(`/api/merge-jobs/${jobId}/images/presign`, {
                    method: 'POST',
                    body: JSON.stringify({ files: imgData })
                });
                if (!imgPresignRes.ok) throw new Error("Image Presign Failed");
                const presignedImgs = await imgPresignRes.json();

                await Promise.all(presignedImgs.map(async (p: any, i: number) => {
                    await fetch(p.url, {
                        method: 'PUT',
                        headers: { 'Content-Type': imageFiles[i].file.type },
                        body: imageFiles[i].file
                    });
                }));
            }

            toast.success("Job created!");
            router.push(`/dashboard/jobs/${jobId}`);

        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Something went wrong");
            setUploading(false);
        }
    };

    const removeFile = (index: number) => {
        setFileStats(prev => prev.filter((_, i) => i !== index));
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <Route className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create New Route</h1>
                        <p className="text-muted-foreground">Upload your GPX and PNG files here.</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left: Upload Areas (Split into 2 columns nested or stacked) */}
                <div className="md:col-span-2 space-y-6">

                    {/* GPX Upload */}
                    <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                            <FileCode className="size-4 text-primary" /> GPX Fragments
                        </h3>
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[200px]
                                ${dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/50 hover:border-primary/50 hover:bg-neutral-50'}
                            `}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragging(false);
                                handleFiles(e.dataTransfer.files);
                            }}
                        >
                            <input
                                type="file"
                                multiple
                                accept=".gpx"
                                className="hidden"
                                id="file-upload"
                                onChange={(e) => handleFiles(e.target.files)}
                                disabled={uploading}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer space-y-4 flex flex-col items-center group w-full">
                                <div className="p-4 rounded-full bg-secondary/50 group-hover:bg-primary/10 transition-colors shadow-sm">
                                    <UploadCloud className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div>
                                    <p className="font-bold text-lg">Drop GPX Files Here</p>
                                    <p className="text-xs text-muted-foreground">or click to browse</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* PNG/Image Upload */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <ImageIcon className="size-4 text-primary" /> Route Photos (PNG)
                            </h3>
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Optional</span>
                        </div>

                        <div
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[200px]
                                ${imgDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/50 hover:border-primary/50 hover:bg-neutral-50'}
                            `}
                            onDragOver={(e) => { e.preventDefault(); setImgDragging(true); }}
                            onDragLeave={() => setImgDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setImgDragging(false);
                                handleImages(e.dataTransfer.files);
                            }}
                        >
                            <input
                                type="file"
                                multiple
                                accept="image/png, image/jpeg"
                                className="hidden"
                                id="img-upload"
                                onChange={(e) => handleImages(e.target.files)}
                                disabled={uploading}
                            />
                            <label htmlFor="img-upload" className="cursor-pointer space-y-4 flex flex-col items-center group w-full">
                                <div className="p-4 rounded-full bg-secondary/50 group-hover:bg-primary/10 transition-colors shadow-sm">
                                    <ImageIcon className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div>
                                    <p className="font-bold text-lg">Drop PNG Files Here</p>
                                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                        Upload summary screens to analyze pace, calories, and time.
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Image Previews */}
                        {imageFiles.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                                {imageFiles.map((img, i) => (
                                    <div key={i} className="relative group border border-border/50 rounded-lg overflow-hidden bg-background">
                                        <div className="relative h-24 w-full">
                                            <Image
                                                src={img.preview}
                                                alt="preview"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="p-2 flex items-center justify-between">
                                            <p className="text-xs truncate max-w-[80%]">{img.file.name}</p>
                                            <button
                                                onClick={() => removeImage(i)}
                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                <Trash2 className="size-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: File List & stats */}
                <div className="space-y-6">
                    <Card className="h-full border-border/50 sticky top-4">
                        <CardHeader>
                            <CardTitle className="text-lg">Fragments ({fileStats.length})</CardTitle>
                            <CardDescription>Files ready to merge</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fileStats.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm italic">
                                    No GPX files added.
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {fileStats.map((stat, i) => (
                                        <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 text-sm group">
                                            <div className="space-y-1 min-w-0">
                                                <div className="font-medium truncate flex items-center gap-2">
                                                    <FileCode className="size-3 text-primary" />
                                                    {stat.file.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex gap-3">
                                                    <span>{(stat.distance / 1000).toFixed(2)} km</span>
                                                    <span>{stat.points} pts</span>
                                                </div>
                                            </div>
                                            <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="size-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="pt-4 border-t border-border/50 space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Photos attached</span>
                                        <span className="font-medium">{imageFiles.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold">
                                        <span>Total Est. Distance</span>
                                        <span>{(fileStats.reduce((acc, curr) => acc + curr.distance, 0) / 1000).toFixed(2)} km</span>
                                    </div>
                                </div>
                                <Button
                                    className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                                    onClick={handleCreate}
                                    disabled={fileStats.length === 0 || uploading}
                                >
                                    {uploading ? <Loader2 className="animate-spin mr-2" /> : "Create & Merge"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
