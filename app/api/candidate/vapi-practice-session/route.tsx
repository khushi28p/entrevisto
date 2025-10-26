import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { InterviewSessionType } from "@prisma/client";

/**
 * POST /api/candidate/vapi-practice-session
 * Creates a new practice interview session
 */
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Find user and verify they're a candidate with resume
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        role: true,
        candidateProfile: {
          select: {
            id: true,
            resumeText: true,
          },
        },
      },
    });

    if (!user || user.role !== "CANDIDATE") {
      return NextResponse.json(
        { success: false, message: "Access denied. Candidates only." },
        { status: 403 }
      );
    }

    if (!user.candidateProfile) {
      return NextResponse.json(
        { success: false, message: "Candidate profile not found." },
        { status: 404 }
      );
    }

    if (!user.candidateProfile.resumeText) {
      return NextResponse.json(
        {
          success: false,
          message: "Resume text not found. Please upload your resume first.",
        },
        { status: 400 }
      );
    }

    // Generate a temporary Vapi Call ID (will be replaced with real one from client)
    const tempVapiCallId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create InterviewResult record
    const interviewResult = await prisma.interviewResult.create({
      data: {
        candidateProfileId: user.candidateProfile.id,
        sessionType: InterviewSessionType.PRACTICE,
        vapiCallId: tempVapiCallId,
        transcript: "", // Will be updated after call
        aiFeedback: "", // Will be updated after call
        score: 0, // Will be updated after call
      },
    });

    return NextResponse.json(
      {
        success: true,
        sessionId: interviewResult.id,
        message: "Practice session created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating practice session:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create practice session." },
      { status: 500 }
    );
  }
}