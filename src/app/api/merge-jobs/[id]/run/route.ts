import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { s3Client, BUCKET_NAME } from '@/lib/s3';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { mergeGpxFiles } from '@/lib/gpx';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session?.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { sub } = session.user;
    const { id } = await params;

    try {
        const job = await db.mergeJob.findUnique({
            where: { id },
            include: { fragments: { orderBy: { order: 'asc' } } }
        });

        if (!job) return new NextResponse('Job not found', { status: 404 });
        if (!job) return new NextResponse('Job not found', { status: 404 });

        // Admin or Owner check
        if (job.userId !== sub) {
            const user = await db.user.findUnique({ where: { id: sub } });
            if (user?.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });
        }

        // Update status
        await db.mergeJob.update({
            where: { id },
            data: { status: 'PROCESSING' }
        });

        // Download fragments
        const fileContents = [];
        for (const fragment of job.fragments) {
            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fragment.s3Key,
            });
            const response = await s3Client.send(command);
            const str = await response.Body?.transformToString();
            if (str) fileContents.push(str);
        }

        if (fileContents.length === 0) {
            await db.mergeJob.update({
                where: { id },
                data: { status: 'FAILED', logs: 'No fragments found' }
            });
            return new NextResponse('No fragments', { status: 400 });
        }

        // Merge
        const mergedGpx = mergeGpxFiles(fileContents);

        // Upload result
        const resultKey = `jobs/${id}/merged.gpx`;
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: resultKey,
            Body: mergedGpx,
            ContentType: 'application/gpx+xml',
        }));

        // Update Job
        await db.mergeJob.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                mergedFileKey: resultKey,
            }
        });

        return NextResponse.json({ success: true, key: resultKey });

    } catch (error: any) {
        console.error('Error running job:', error);
        await db.mergeJob.update({
            where: { id },
            data: { status: 'FAILED', logs: error.message }
        });
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
