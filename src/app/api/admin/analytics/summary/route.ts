import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { db } from '@/lib/db';
import { subDays } from 'date-fns';

export async function GET(req: NextRequest) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await db.user.findUnique({ where: { auth0Sub: session.user.sub } });
        if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const searchParams = req.nextUrl.searchParams;
        const days = parseInt(searchParams.get('days') || '30');
        const startDate = subDays(new Date(), days);

        // 1. User Stats
        const totalUsers = await db.user.count();
        const newUsers = await db.user.count({ where: { createdAt: { gte: startDate } } });

        // Active Users (approximate via logins or merge jobs if no login event yet)
        // We look for ANY event in the window
        const distinctActiveUsers = await db.analyticsEvent.findMany({
            where: { createdAt: { gte: startDate }, userId: { not: null } },
            distinct: ['userId'],
            select: { userId: true }
        });
        const activeUsers = distinctActiveUsers.length;

        // 2. Job Stats (from MergeJob table as it's the source of truth for jobs)
        const totalJobs = await db.mergeJob.count();
        const jobsInRange = await db.mergeJob.count({ where: { createdAt: { gte: startDate } } });
        const completedJobs = await db.mergeJob.count({ where: { createdAt: { gte: startDate }, status: 'COMPLETED' } });
        const failedJobs = await db.mergeJob.count({ where: { createdAt: { gte: startDate }, status: 'FAILED' } });

        // 3. Durations
        const completedJobsWithTime = await db.mergeJob.findMany({
            where: {
                createdAt: { gte: startDate },
                status: 'COMPLETED',
                startedAt: { not: null },
                finishedAt: { not: null }
            },
            select: { startedAt: true, finishedAt: true }
        });

        let totalDuration = 0;
        completedJobsWithTime.forEach(j => {
            if (j.finishedAt && j.startedAt) {
                totalDuration += (j.finishedAt.getTime() - j.startedAt.getTime());
            }
        });
        const avgDuration = completedJobsWithTime.length > 0 ? Math.round(totalDuration / completedJobsWithTime.length / 1000) : 0;

        return NextResponse.json({
            users: {
                total: totalUsers,
                new: newUsers,
                active: activeUsers
            },
            jobs: {
                total: totalJobs, // All time
                inRange: jobsInRange,
                completed: completedJobs,
                failed: failedJobs,
                successRate: jobsInRange > 0 ? Math.round((completedJobs / jobsInRange) * 100) : 0,
                avgDurationSec: avgDuration
            }
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
