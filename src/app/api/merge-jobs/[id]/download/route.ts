import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { s3Client, BUCKET_NAME } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session?.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { sub } = session.user;
    const { id } = await params;

    try {
        const job = await db.mergeJob.findUnique({
            where: { id },
            include: { outputFiles: true }
        });

        if (!job) return new NextResponse('Job not found', { status: 404 });

        // Check ownership (compare against linked user's auth0Sub if possible, or assume userId link is correct)
        // Note: In new schema, userId is the CUID, not sub. We need to check if job.user.auth0Sub === sub
        const jobOwner = await db.user.findUnique({ where: { id: job.userId } });

        if (jobOwner?.auth0Sub !== sub) {
            const caller = await db.user.findUnique({ where: { auth0Sub: sub } });
            if (caller?.role !== 'admin') {
                return new NextResponse('Forbidden', { status: 403 });
            }
        }

        const outputFile = job.outputFiles[0];
        if (!outputFile?.storageKey) {
            return new NextResponse('No merged file available', { status: 404 });
        }

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: outputFile.storageKey,
            ResponseContentDisposition: 'attachment; filename="merged.gpx"',
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        return NextResponse.json({ url });

    } catch (error) {
        console.error('Error generating download url:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
