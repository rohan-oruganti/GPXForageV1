import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { s3Client, BUCKET_NAME } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session?.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { sub } = session.user;
    const { id } = await params;

    try {
        const job = await db.mergeJob.findUnique({ where: { id } });
        if (!job) {
            return new NextResponse('Job not found', { status: 404 });
        }
        if (job.userId !== sub) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const body = await req.json();
        const { files } = body as { files: { name: string; size: number }[] };

        if (!files || !Array.isArray(files)) {
            return new NextResponse('Invalid body', { status: 400 });
        }

        const result = [];

        // Get current fragment count to determine order
        const currentCount = await db.gpxFragment.count({ where: { jobId: id } });

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const order = currentCount + i;

            // Create DB record
            const fragment = await db.gpxFragment.create({
                data: {
                    jobId: id,
                    originalName: file.name,
                    s3Key: `jobs/${id}/fragments/${Date.now()}-${i}.gpx`, // temp key
                    order: order,
                }
            });

            // Generate Presigned URL
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fragment.s3Key,
                ContentType: 'application/gpx+xml', // Enforce type
            });

            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

            result.push({
                fragmentId: fragment.id,
                originalName: file.name,
                url,
                key: fragment.s3Key
            });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error generating presigned urls:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
