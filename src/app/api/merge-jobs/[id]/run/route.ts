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
            include: { fragmentFiles: { orderBy: { createdAt: 'asc' } } }
        });

        if (!job) return new NextResponse('Job not found', { status: 404 });

        // Admin or Owner check
        if (job.userId) {
            const user = await db.user.findUnique({ where: { id: job.userId } });
            if (user?.auth0Sub !== sub && user?.role !== 'admin') {
                return new NextResponse('Forbidden', { status: 403 });
            }
        }

        // Update status
        await db.mergeJob.update({
            where: { id },
            data: { status: 'PROCESSING', startedAt: new Date() }
        });

        // Download fragments
        const fileContents = [];
        for (const fragment of job.fragmentFiles) {
            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fragment.storageKey,
            });
            const response = await s3Client.send(command);
            const str = await response.Body?.transformToString();
            if (str) fileContents.push(str);
        }

        if (fileContents.length === 0) {
            await db.mergeJob.update({
                where: { id },
                data: { status: 'FAILED', errorMessage: 'No fragments found' }
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

        // Create Output File Record
        await db.outputFile.create({
            data: {
                mergeJobId: id,
                storageKey: resultKey,
                pointCount: 0, // Calculate this if possible from mergedGpx
            }
        });

        // Update Job
        await db.mergeJob.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                finishedAt: new Date(),
            }
        });

        return NextResponse.json({ success: true, key: resultKey });

    } catch (error: any) {
        console.error('Error running job:', error);
        await db.mergeJob.update({
            where: { id },
            data: { status: 'FAILED', errorMessage: error.message }
        });
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
