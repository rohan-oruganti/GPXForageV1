import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { s3Client, BUCKET_NAME } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: jobId } = await params;
        const { files } = await req.json(); // Expects { files: [{ name: string, size: number, type: string }] }

        if (!files || !Array.isArray(files)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const job = await db.mergeJob.findUnique({ where: { id: jobId } });
        if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

        // Verify ownership
        const user = await db.user.findUnique({ where: { auth0Sub: session.user.sub } })
        if (job.userId !== user?.id && user?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const presignedUrls = await Promise.all(files.map(async (file: any) => {
            const fileId = randomUUID();
            const key = `jobs/${jobId}/images/${fileId}-${file.name}`;

            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                ContentType: file.type || 'image/png',
            });

            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

            // Create RouteImage record in DB
            await db.routeImage.create({
                data: {
                    mergeJobId: jobId,
                    originalFilename: file.name,
                    storageKey: key,
                    mimeType: file.type || 'image/png',
                    sizeBytes: file.size || 0
                }
            });

            return {
                originalName: file.name,
                key,
                url
            };
        }));

        return NextResponse.json(presignedUrls);

    } catch (error) {
        console.error('Error generating presigned URLs for images:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
