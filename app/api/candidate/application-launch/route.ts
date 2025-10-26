// app/api/candidate/application-launch/route.ts

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, sessionType } = body;

    if (!jobId || sessionType !== "APPLICATION") {
      return NextResponse.json(
        { message: "Invalid request parameters" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Verify candidate profile exists with resume
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        resumeText: true,
      },
    });

    if (!candidateProfile) {
      return NextResponse.json(
        { message: "Candidate profile not found" },
        { status: 404 }
      );
    }

    if (!candidateProfile.resumeText) {
      return NextResponse.json(
        { message: "Resume must be uploaded before starting interview" },
        { status: 400 }
      );
    }

    // Verify job exists and is active
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: { id: true, isActive: true },
    });

    if (!job || !job.isActive) {
      return NextResponse.json(
        { message: "Job not found or not active" },
        { status: 404 }
      );
    }

    // Check for existing application
    const existingApplication = await prisma.application.findFirst({
      where: {
        candidateId: candidateProfile.id,
        jobPostingId: jobId,
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { message: "You have already applied to this position" },
        { status: 400 }
      );
    }

    // Create application and interview result in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create interview result first
      const interviewResult = await tx.interviewResult.create({
        data: {
          sessionType: "APPLICATION",
          transcript: "",
          aiFeedback: "",
          score: 0,
          vapiCallId: `pending_${Date.now()}`, // Temporary, will be updated by VapiWidget
          candidateProfileId: candidateProfile.id,
        },
      });

      // Create application linked to interview result
      const application = await tx.application.create({
        data: {
          candidateId: candidateProfile.id,
          jobPostingId: jobId,
          status: "APPLIED",
          interviewResultId: interviewResult.id,
        },
      });

      // Update interview result with application ID
      await tx.interviewResult.update({
        where: { id: interviewResult.id },
        data: { applicationId: application.id },
      });

      return { interviewResult, application };
    });

    return NextResponse.json(
      {
        message: "Application created successfully",
        interviewResultId: result.interviewResult.id,
        applicationId: result.application.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error launching application interview:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}