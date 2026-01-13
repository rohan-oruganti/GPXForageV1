import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { db } from '@/lib/db';
import { subDays } from 'date-fns';

export async function GET(req: NextRequest) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
        const startDate = subDays(new Date(), days);

        // Fetch events with meta containing 'country'
        // In PostgreSQL with Prism logic, querying JSON keys deeply can be tricky.
        // For MVP, we fetch relevant events and aggregate in JS. 
        // Real-world: Use raw SQL for aggregation.
        const events = await db.analyticsEvent.findMany({
            where: {
                createdAt: { gte: startDate },
                meta: { path: ['country'], not: Prisma.JsonNull }
            },
            select: { meta: true }
        });

        const countryCounts: Record<string, number> = {};

        events.forEach(ev => {
            const m = ev.meta as any;
            if (m && m.country) {
                countryCounts[m.country] = (countryCounts[m.country] || 0) + 1;
            } else {
                // If we want to track unknowns?
                // countryCounts['Unknown'] = (countryCounts['Unknown'] || 0) + 1;
            }
        });

        // Transform to array
        const data = Object.entries(countryCounts).map(([code, count]) => ({ code, count }));

        return NextResponse.json(data);

    } catch (e) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// Helper to access Prisma global enum if needed, but here we used `not: Prisma.JsonNull`
import { Prisma } from '@prisma/client';
