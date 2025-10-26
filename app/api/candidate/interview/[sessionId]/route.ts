import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/candidate/interview/[sessionId]
 * Fetches interview session data including resume text
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { sessionId } = await params;

    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Fetch interview session with candidate profile
    const session = await prisma.interviewResult.findUnique({
      where: { id: sessionId },
      include: {
        candidateProfile: {
          select: {
            userId: true,
            resumeText: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Interview session not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (session.candidateProfile?.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        sessionType: session.sessionType,
        resumeText: session.candidateProfile?.resumeText || "",
        vapiCallId: session.vapiCallId,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching interview session:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch session data" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/candidate/interview/[sessionId]
 * Updates interview session with transcript and feedback after call ends
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { sessionId } = await params;
    const body = await req.json();
    const { vapiCallId, transcript, aiFeedback, score } = body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Verify session ownership
    const session = await prisma.interviewResult.findUnique({
      where: { id: sessionId },
      include: {
        candidateProfile: {
          select: { userId: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 }
      );
    }

    if (session.candidateProfile?.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Update interview result
    const updatedSession = await prisma.interviewResult.update({
      where: { id: sessionId },
      data: {
        vapiCallId: vapiCallId || session.vapiCallId,
        transcript: transcript || session.transcript,
        aiFeedback: aiFeedback || session.aiFeedback,
        score: score !== undefined ? score : session.score,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Interview session updated successfully",
      session: updatedSession,
    });
  } catch (error) {
    console.error("Error updating interview session:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update session" },
      { status: 500 }
    );
  }
}