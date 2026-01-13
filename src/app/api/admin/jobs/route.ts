import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth0 } from '@/lib/auth0';

export async function GET(req: NextRequest) {
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

        const jobs = await db.mergeJob.findMany({
            include: {
                user: {
                    select: { email: true, id: true }
                },
                _count: {
                    select: { fragmentFiles: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(jobs);

    } catch (error) {
        console.error('Error fetching admin jobs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
