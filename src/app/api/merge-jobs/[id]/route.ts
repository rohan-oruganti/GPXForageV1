import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";

import { s3Client, BUCKET_NAME } from "@/lib/s3";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mergeGpxFiles } from "@/lib/gpx";
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const job = await db.mergeJob.findUnique({
            where: { id: id },
            include: {
                fragmentFiles: true,
                outputFiles: true,
                routeImages: true
            }
        });

        if (!job) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        const user = await db.user.findUnique({
            where: { auth0Sub: session.user.sub }
        });

        if (job.userId !== user?.id && user?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Generate signed URLs for fragments
        const fragmentsWithUrls = await Promise.all(job.fragmentFiles.map(async (f) => {
            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: f.storageKey,
            });
            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            return { ...f, url };
        }));

        // Generate signed URLs for outputs
        const outputsWithUrls = await Promise.all(job.outputFiles.map(async (f) => {
            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: f.storageKey,
            });
            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            return { ...f, url };
        }));

        // Generate signed URLs for images
        const imagesWithUrls = await Promise.all(job.routeImages.map(async (f) => {
            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: f.storageKey,
            });
            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            return { ...f, url };
        }));

        return NextResponse.json({
            ...job,
            fragmentFiles: fragmentsWithUrls,
            outputFiles: outputsWithUrls,
            routeImages: imagesWithUrls
        });
    } catch (error) {
        console.error('Error fetching job:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Check ownership
        const user = await db.user.findUnique({
            where: { auth0Sub: session.user.sub }
        });

        const job = await db.mergeJob.findUnique({
            where: { id: id },
            include: { fragmentFiles: true }
        });
        if (!job) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

        if (job.userId !== user?.id && user?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Handle Rename
        if (body.title) {
            const updatedJob = await db.mergeJob.update({
                where: { id: id },
                data: { title: body.title },
                include: { fragmentFiles: true, outputFiles: true }
            });
            return NextResponse.json(updatedJob);
        }

        // Handle Merge
        if (body.status === 'COMPLETED' || body.action === 'MERGE') {
            // 1. Fetch Fragments
            console.log("Fetching fragments for merge...");
            const fragmentContents = await Promise.all(job.fragmentFiles.map(async f => {
                const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: f.storageKey });
                const response = await s3Client.send(command);
                return await response.Body?.transformToString() || "";
            }));

            // 2. Merge
            console.log("Merging content...");
            const mergedGpx = mergeGpxFiles(fragmentContents);

            // 3. Upload Output
            const outputKey = `jobs/${id}/output/merged.gpx`;
            console.log("Uploading merged file to", outputKey);
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: outputKey,
                Body: mergedGpx,
                ContentType: 'application/gpx+xml'
            }));

            // 4. Save OutputFile & Update Job
            await db.outputFile.create({
                data: {
                    mergeJobId: id,
                    storageKey: outputKey,
                    pointCount: 0 // We could parse this back from mergedGpx if needed, or calc during merge
                }
            });

            const completedJob = await db.mergeJob.update({
                where: { id: id },
                data: {
                    status: 'COMPLETED',
                    finishedAt: new Date()
                },
                include: {
                    fragmentFiles: true,
                    outputFiles: true
                }
            });

            const durationMs = completedJob.finishedAt!.getTime() - (completedJob.startedAt?.getTime() || completedJob.createdAt.getTime());
            await trackEvent(completedJob.userId, "MERGE_COMPLETED", { jobId: completedJob.id, durationMs });

            return NextResponse.json(completedJob);
        }

        // Fallback generic update
        const updatedJob = await db.mergeJob.update({
            where: { id: id },
            data: body,
            include: {
                fragmentFiles: true,
                outputFiles: true
            }
        });

        return NextResponse.json(updatedJob);

    } catch (error) {
        console.error('Error updating job:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check ownership
        const user = await db.user.findUnique({
            where: { auth0Sub: session.user.sub }
        });

        const job = await db.mergeJob.findUnique({ where: { id: id } });
        if (!job) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

        if (job.userId !== user?.id && user?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete job (Cascade will handle related files in DB)
        // Note: S3 files are not automatically deleted here. 
        // For a production app we would want to delete S3 objects too,
        // but for this MVP DB cleanup is sufficient to hide it from UI.
        await db.mergeJob.delete({ where: { id: id } });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting job:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
