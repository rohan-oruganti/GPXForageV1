import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
    const session = await getSession();
    if (!session?.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { sub } = session.user;

    try {
        const jobs = await db.mergeJob.findMany({
            where: { userId: sub },
            orderBy: { createdAt: 'desc' },
            include: { fragments: true },
        });
        return NextResponse.json(jobs);
    } catch (error) {
        console.error('Error listing jobs:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session?.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { sub, email } = session.user;

    try {
        // Ensure user exists
        let user = await db.user.findUnique({ where: { id: sub } });
        if (!user) {
            if (!email) {
                return new NextResponse('User email required', { status: 400 });
            }
            user = await db.user.create({
                data: {
                    id: sub,
                    email: email,
                    role: 'user', // Default role
                },
            });
        }

        // Create job
        const job = await db.mergeJob.create({
            data: {
                userId: user.id,
                status: 'PENDING',
            },
        });

        return NextResponse.json(job);
    } catch (error) {
        console.error('Error creating job:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
