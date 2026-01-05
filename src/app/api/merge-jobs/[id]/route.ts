import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
            include: { fragments: { orderBy: { order: 'asc' } } },
        });

        if (!job) {
            return new NextResponse('Not Found', { status: 404 });
        }

        // Authorization check
        // If admin is implemented, check role. For now, only owner.
        // If we want admin access, we should check user role from DB.
        if (job.userId !== sub) {
            // Fetch user role if needed, or just forbid
            const user = await db.user.findUnique({ where: { id: sub } });
            if (user?.role !== 'admin') {
                return new NextResponse('Forbidden', { status: 403 });
            }
        }

        return NextResponse.json(job);
    } catch (error) {
        console.error('Error fetching job:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
