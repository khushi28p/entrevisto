import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function POST(req: Request) {
  // 1. Authentication
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ success: false, message: 'Unauthorized: User not authenticated.' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch (error) {
    console.log('Error parsing JSON body:', error);
    return NextResponse.json({ success: false, message: 'Bad Request: Invalid JSON body.' }, { status: 400 });
  }
  
  const { title, description, requirements, isActive } = body;

  // 2. Input Validation
  if (!title || !description || !requirements) {
    return NextResponse.json({ success: false, message: 'Job Title, Description, and AI Requirements are required.' }, { status: 400 });
  }

  try {
    // 3. Authorization and Data Fetching
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkId },
      select: { 
        role: true,
        recruiterProfile: {
          select: { companyId: true } 
        }
      },
    });

    if (!user || user.role !== Role.RECRUITER || !user.recruiterProfile?.companyId) {
      // This covers three cases: user not found, not a recruiter, or not onboarded.
      return NextResponse.json({ success: false, message: 'Authorization failed. User must be an onboarded Recruiter.' }, { status: 403 });
    }

    const companyId = user.recruiterProfile.companyId;

    // 4. Create the Job Posting
    const newJob = await prisma.jobPosting.create({
      data: {
        title: title,
        description: description,
        requirements: requirements,
        isActive: isActive ?? true, // Default to true if missing
        companyId: companyId,
      },
    });

    console.log(`New Job posted: ${newJob.id} for company ${companyId}`);

    // 5. Success Response
    return NextResponse.json({ 
      success: true, 
      jobId: newJob.id,
      message: 'Job posting created successfully.'
    }, { status: 200 });

  } catch (error) {
    console.error('Job Posting Creation Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal Server Error: Failed to create job posting.' 
    }, { status: 500 });
  }
}
