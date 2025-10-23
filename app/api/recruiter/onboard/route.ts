import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function POST(req: Request) {
  // 1. Authentication: Get the Clerk user ID
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
  
  const { companyName, companyDescription, companyIndustry, companyWebsite } = body;

  // 2. Input Validation (Must match required fields from the form)
  if (!companyName || !companyIndustry) {
    return NextResponse.json({ success: false, message: 'Company Name and Industry are required.' }, { status: 400 });
  }

  try {
    // 3. Find User and Authorize: Ensure user exists and is marked as RECRUITER
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkId },
      include: { recruiterProfile: true },
    });

    if (!user) {
      // User must exist in the DB (via webhook or fallback)
      return NextResponse.json({ success: false, message: 'User record not found. Please log in again.' }, { status: 404 });
    }
    
    // Authorization Check: Must be a Recruiter (as set on /select-role)
    if (user.role !== Role.RECRUITER) {
      return NextResponse.json({ success: false, message: 'Unauthorized access. User role is not Recruiter.' }, { status: 403 });
    }

    // Check for existing profile (Onboarding should only happen once)
    if (user.recruiterProfile) {
       return NextResponse.json({ success: false, message: 'Recruiter already onboarded.' }, { status: 409 });
    }

    // 4. Create the Company and link the Recruiter Profile
    
    // A. Create the Company
    const newCompany = await prisma.company.create({
        data: {
            name: companyName,
            description: companyDescription,
            industry: companyIndustry,
            website: companyWebsite,
        },
    });

    // B. Create the RecruiterProfile, linking the User and the new Company
    const newRecruiterProfile = await prisma.recruiterProfile.create({
        data: {
            userId: user.id,
            companyId: newCompany.id,
        },
    });

    console.log(`Recruiter ${user.id} successfully onboarded with Company ${newCompany.id}`);

    // 5. Success Response
    return NextResponse.json({ 
      success: true, 
      companyId: newCompany.id,
      recruiterProfileId: newRecruiterProfile.id
    }, { status: 200 });

  } catch (error) {
    console.error('Recruiter Onboarding Critical Error:', error);
    // Return a generic 500 message on internal failure
    return NextResponse.json({ 
      success: false, 
      message: 'Internal Server Error: Failed to save company data.' 
    }, { status: 500 });
  }
}