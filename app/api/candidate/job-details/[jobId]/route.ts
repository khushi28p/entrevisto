import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }>}) {
    const { userId: clerkId } =await auth();
    const {jobId} = await params;

    if (!clerkId) {
        return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    try {
        // 1. Fetch Job and check existence
        const job = await prisma.jobPosting.findUnique({
            where: { id: jobId, isActive: true },
            select: {
                id: true,
                title: true,
                description: true,
                requirements: true,
                company: { select: { name: true } },
                _count: { select: { applications: true } },
            },
        });

        if (!job) {
            return NextResponse.json({ success: false, message: 'Job posting not found or is inactive.' }, { status: 404 });
        }
        
        // 2. Fetch Candidate Status
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, candidateProfile: { select: { id: true, resumeText: true } } },
        });

        const candidateProfileId = user?.candidateProfile?.id;
        
        // 3. Check for existing application
        let existingApplication = null;
        if (candidateProfileId) {
            existingApplication = await prisma.application.findFirst({
                where: { 
                    candidateId: candidateProfileId, 
                    jobPostingId: jobId 
                },
                select: { id: true, status: true },
            });
        }
        
        // 4. Construct response
        const responseData = {
            id: job.id,
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            companyName: job.company.name,
            applicationsCount: job._count.applications,
            hasResumeText: !!user?.candidateProfile?.resumeText,
            hasExistingApplication: !!existingApplication,
            existingApplicationId: existingApplication?.id || null,
        };

        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error('Job Details API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error fetching job details.' }, { status: 500 });
    }
}
