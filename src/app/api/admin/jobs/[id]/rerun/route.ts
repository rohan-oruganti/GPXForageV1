import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth0 } from '@/lib/auth0';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { auth0Sub: session.user.sub }
        });

        if (user?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        // Reset job status to PENDING or PROCESSING to simulate rerun
        const updatedJob = await db.mergeJob.update({
            where: { id },
            data: {
                status: 'PENDING',
                errorMessage: null,
                startedAt: null,
                finishedAt: null,
                outputFiles: {
                    deleteMany: {} // Clear old outputs
                }
            }
        });

        return NextResponse.json({ success: true, job: updatedJob });

    } catch (error) {
        console.error('Error rerunning job:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
