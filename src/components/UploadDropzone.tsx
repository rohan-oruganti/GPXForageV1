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
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
                ${dragging ? 'border-orange-500 bg-orange-50/50' : 'border-neutral-200 dark:border-neutral-800 hover:border-orange-500/50'}
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
                    <Loader2 className="size-10 animate-spin text-orange-500 mx-auto" />
                    <p className="text-sm text-muted-foreground">Uploading fragments...</p>
                </div>
            ) : (
                <label htmlFor="file-upload" className="cursor-pointer space-y-4 w-full h-full flex flex-col items-center">
                    <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <UploadCloud className="size-8 text-neutral-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Click to upload or drag and drop</h3>
                        <p className="text-sm text-muted-foreground">GPX files only</p>
                    </div>
                </label>
            )}
        </div>
    );
}
