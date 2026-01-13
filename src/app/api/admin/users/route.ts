import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await db.user.findUnique({ where: { auth0Sub: session.user.sub } });
        if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const limit = 50;
        // In real app: Pagination via searchParams

        const users = await db.user.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { jobs: true, analyticsEvents: true }
                }
            }
        });

        // Map to safe DTO
        const data = users.map(u => ({
            id: u.id,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
            jobCount: u._count.jobs,
            eventCount: u._count.analyticsEvents,
            lastActive: u.createdAt // Placeholder, real impl would query max(createAt) from events
        }));

        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
