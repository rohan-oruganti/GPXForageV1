import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";

export async function GET(req: NextRequest) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { auth0Sub: session.user.sub },
        });

        if (!user) {
            return NextResponse.json([]);
        }

        const jobs = await db.mergeJob.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                fragmentFiles: true,
                outputFiles: true
            }
        });

        return NextResponse.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure user exists
        const user = await db.user.upsert({
            where: { auth0Sub: session.user.sub },
            create: {
                auth0Sub: session.user.sub,
                email: session.user.email || "",
                role: 'user'
            },
            update: {
                email: session.user.email
            }
        });

        const job = await db.mergeJob.create({
            data: {
                userId: user.id,
                status: 'PENDING'
            }
        });


        await trackEvent(user.id, "MERGE_CREATED", { jobId: job.id });

        return NextResponse.json(job);
    } catch (error) {
        console.error('Error creating job:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
