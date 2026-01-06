import { db } from './db';

// 1. Create or Get User (Auth0 Sync)
export async function syncUser(auth0Sub: string, email: string) {
    return await db.user.upsert({
        where: { auth0Sub },
        update: { email },
        create: { auth0Sub, email },
    });
}

// 2. Create a new Merge Job
export async function createMergeJob(userId: string) {
    return await db.mergeJob.create({
        data: {
            userId,
            status: 'UPLOADING',
        },
    });
}

// 3. Add Fragments to Job
export async function addFragment(jobId: string, filename: string, key: string) {
    return await db.fragmentFile.create({
        data: {
            mergeJobId: jobId,
            originalFilename: filename,
            storageKey: key,
        },
    });
}

// 4. Update Job Status & Results
export async function completeJob(jobId: string, outputKey: string, stats: { points: number }) {
    // Transaction to ensure atomicity
    return await db.$transaction(async (tx) => {
        await tx.outputFile.create({
            data: {
                mergeJobId: jobId,
                storageKey: outputKey,
                pointCount: stats.points,
            },
        });

        return await tx.mergeJob.update({
            where: { id: jobId },
            data: {
                status: 'COMPLETED',
                finishedAt: new Date(),
            },
        });
    });
}

// 5. Get User's Job History
export async function getUserJobs(userId: string) {
    return await db.mergeJob.findMany({
        where: { userId },
        include: {
            fragmentFiles: true,
            outputFiles: true,
        },
        orderBy: { createdAt: 'desc' },
    });
}
