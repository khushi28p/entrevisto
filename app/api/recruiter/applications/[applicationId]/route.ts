import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApplicationStatus } from '@prisma/client';

type RouteParams = {
  params: Promise<{ applicationId: string }>;
};

// GET - Fetch single application (for edit page if needed)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId: clerkId } = await auth();
    const { applicationId } = await params;

    if (!clerkId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a recruiter
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        role: true,
        recruiterProfile: {
          select: { companyId: true }
        }
      },
    });

    if (!user || user.role !== 'RECRUITER') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Fetch application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: {
          include: {
            user: {
              select: {
                email: true,
                createdAt: true
              }
            }
          }
        },
        jobPosting: {
          include: {
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        interviewResult: true
      }
    });

    if (!application) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    // Verify ownership
    if (application.jobPosting.company.id !== user.recruiterProfile?.companyId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update application status
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId: clerkId } = await auth();
    const { applicationId } = await params;

    if (!clerkId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a recruiter
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        role: true,
        recruiterProfile: {
          select: { companyId: true }
        }
      },
    });

    if (!user || user.role !== 'RECRUITER') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !Object.values(ApplicationStatus).includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Fetch application to verify ownership
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        jobPosting: {
          include: {
            company: true
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    // Verify ownership
    if (application.jobPosting.company.id !== user.recruiterProfile?.companyId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: status as ApplicationStatus,
        updatedAt: new Date()
      },
      include: {
        candidate: {
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        },
        jobPosting: {
          select: {
            title: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Application status updated successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}