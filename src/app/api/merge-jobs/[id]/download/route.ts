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
        const job = await db.mergeJob.findUnique({ where: { id } });

        if (!job) return new NextResponse('Job not found', { status: 404 });

        // Check ownership or admin
        if (job.userId !== sub) {
            const user = await db.user.findUnique({ where: { id: sub } });
            if (user?.role !== 'admin') {
                return new NextResponse('Forbidden', { status: 403 });
            }
        }

        if (!job.mergedFileKey) {
            return new NextResponse('No merged file available', { status: 404 });
        }

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: job.mergedFileKey,
            ResponseContentDisposition: 'attachment; filename="merged.gpx"',
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        return NextResponse.json({ url });

    } catch (error) {
        console.error('Error generating download url:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
