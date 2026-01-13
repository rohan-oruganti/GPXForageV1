import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { db } from '@/lib/db';
import { subDays, format } from 'date-fns';

export async function GET(req: NextRequest) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await db.user.findUnique({ where: { auth0Sub: session.user.sub } });
        if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const searchParams = req.nextUrl.searchParams;
        const days = parseInt(searchParams.get('days') || '30');
        const startDate = subDays(new Date(), days);

        // 1. Daily Job Activity
        // We'll group MergeJob by createdAt (day)
        const jobs = await db.mergeJob.findMany({
            where: { createdAt: { gte: startDate } },
            select: { createdAt: true, status: true }
        });

        const activityMap = new Map<string, { completed: number, failed: number, total: number }>();

        // Init map to ensure no gaps? (Optional, but UI handles gaps better if we fill 0s)
        for (let i = 0; i <= days; i++) {
            const dateStr = format(subDays(new Date(), i), 'MMM dd');
            activityMap.set(dateStr, { completed: 0, failed: 0, total: 0 });
        }

        jobs.forEach(job => {
            const dateStr = format(job.createdAt, 'MMM dd');
            if (!activityMap.has(dateStr)) activityMap.set(dateStr, { completed: 0, failed: 0, total: 0 });

            const entry = activityMap.get(dateStr)!;
            entry.total++;
            if (job.status === 'COMPLETED') entry.completed++;
            if (job.status === 'FAILED') entry.failed++;
        });

        // Convert to array and reverse (oldest first)
        const activityData = Array.from(activityMap.entries())
            .map(([date, stats]) => ({ name: date, ...stats }))
            .reverse(); // Map iterates insertion order, so if we init from today backwards, we need to reverse.


        return NextResponse.json({
            activity: activityData
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
