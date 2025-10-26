// app/api/candidate/job-details/[jobId]/route.ts

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    const { jobId } = await params;

    if (!clerkId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Fetch job posting with company details
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            name: true,
          },
        },
        applications: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    if (!job.isActive) {
      return NextResponse.json({ message: "Job is no longer active" }, { status: 403 });
    }

    // Check candidate profile and resume
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        resumeText: true,
        applications: {
          where: { jobPostingId: jobId },
          select: { id: true },
        },
      },
    });

    const hasResumeText = Boolean(candidateProfile?.resumeText);
    const existingApplication = candidateProfile?.applications[0];
    const hasExistingApplication = Boolean(existingApplication);

    // Build response
    const response = {
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      companyName: job.company.name,
      applicationsCount: job.applications.length,
      hasExistingApplication,
      hasResumeText,
      existingApplicationId: existingApplication?.id || null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching job details:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}