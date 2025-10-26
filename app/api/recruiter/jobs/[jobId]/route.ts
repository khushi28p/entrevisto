import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type RouteParams = {
  params: Promise<{ jobId: string }>;
};

// GET - Fetch single job posting (for edit page)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId: clerkId } = await auth();
    const { jobId } = await params;

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

    // Fetch job posting
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    }

    // Verify ownership
    if (job.company.id !== user.recruiterProfile?.companyId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update job posting
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId: clerkId } = await auth();
    const { jobId } = await params;

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
    const { title, description, requirements, isActive } = body;

    // Validate required fields
    if (!title || !description || !requirements) {
      return NextResponse.json(
        { message: 'Title, description, and requirements are required' },
        { status: 400 }
      );
    }

    // Fetch job to verify ownership
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        company: true
      }
    });

    if (!existingJob) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    }

    // Verify ownership
    if (existingJob.company.id !== user.recruiterProfile?.companyId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Update job posting
    const updatedJob = await prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        title: title.trim(),
        description: description.trim(),
        requirements: requirements.trim(),
        isActive: isActive !== undefined ? isActive : existingJob.isActive,
        updatedAt: new Date()
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Job posting updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete job posting (optional, for future use)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId: clerkId } = await auth();
    const { jobId } = await params;

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

    // Fetch job to verify ownership
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        company: true
      }
    });

    if (!existingJob) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    }

    // Verify ownership
    if (existingJob.company.id !== user.recruiterProfile?.companyId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Delete job posting
    await prisma.jobPosting.delete({
      where: { id: jobId }
    });

    return NextResponse.json({
      message: 'Job posting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}