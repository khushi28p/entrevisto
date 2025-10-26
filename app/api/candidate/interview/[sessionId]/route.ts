// app/api/candidate/interview/[sessionId]/route.ts

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    const { sessionId } = await params;

    if (!clerkId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { vapiCallId, transcript, aiFeedback, score } = body;

    if (!vapiCallId || !transcript || !aiFeedback || score === undefined) {
      return NextResponse.json(
        { message: "Missing required fields" },
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

    // Fetch interview session to verify ownership
    const session = await prisma.interviewResult.findUnique({
      where: { id: sessionId },
      include: {
        candidateProfile: {
          select: { userId: true },
        },
        application: {
          select: { id: true, status: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { message: "Interview session not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (session.candidateProfile?.userId !== user.id) {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    // Update interview result in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update interview result
      const updatedSession = await tx.interviewResult.update({
        where: { id: sessionId },
        data: {
          vapiCallId,
          transcript,
          aiFeedback,
          score,
        },
      });

      // If this is an application interview, update the application status
      if (session.application && session.sessionType === "APPLICATION") {
        await tx.application.update({
          where: { id: session.application.id },
          data: {
            status: "AI_SCREENING_COMPLETE",
          },
        });
      }

      return updatedSession;
    });

    return NextResponse.json(
      {
        message: "Interview results saved successfully",
        session: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving interview results:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}