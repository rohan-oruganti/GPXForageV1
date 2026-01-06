"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { UploadCloud, Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UploadDropzoneProps {
    jobId: string;
    onUploadComplete: () => void;
}

export default function UploadDropzone({ jobId, onUploadComplete }: UploadDropzoneProps) {
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);

        try {
            // 1. Get presigned URLs
            const fileData = Array.from(files).map(f => ({ name: f.name, size: f.size }));
            const presignRes = await fetch(`/api/merge-jobs/${jobId}/fragments/presign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: fileData }),
            });

            if (!presignRes.ok) throw new Error('Failed to get upload URLs');
            const presignedFiles = await presignRes.json();

            // 2. Upload to S3
            await Promise.all(presignedFiles.map(async (p: any, index: number) => {
                const file = files[index];
                await fetch(p.url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/gpx+xml' },
                    body: file,
                });
            }));

            toast.success("Files uploaded successfully");
            onUploadComplete();
        } catch (error) {
            console.error(error);
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer
                ${dragging
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-border hover:border-primary/50 hover:bg-neutral-50'
                }
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

            {uploading ? (
                <div className="space-y-4">
                    <Loader2 className="size-10 animate-spin text-primary mx-auto" />
                    <p className="text-sm font-medium text-foreground">Uploading fragments...</p>
                </div>
            ) : (
                <label htmlFor="file-upload" className="cursor-pointer space-y-4 w-full h-full flex flex-col items-center group">
                    <div className="p-5 rounded-full bg-secondary transition-colors group-hover:bg-primary/10">
                        <UploadCloud className="size-10 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg text-foreground">Click to upload or drag and drop</h3>
                        <p className="text-sm text-muted-foreground">GPX files only (Max 10MB each)</p>
                    </div>
                    <Button variant="secondary" className="mt-4 pointer-events-none">Select Files</Button>
                </label>
            )}
        </div>
    );
}
