// app/api/user/set-role/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

// Define the expected shape of the request body
interface RequestBody {
  role: "CANDIDATE" | "RECRUITER";
}

// POST handler for setting the user's role
export async function POST(req: Request) {
  // 1. Authenticate the user
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    // FIX 1: Return JSON error response
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized: Missing Clerk User ID",
      },
      { status: 401 }
    );
  }

  // 2. Parse and Validate Input
  let body: RequestBody;
  try {
    body = await req.json();
  } catch (error) {
    // FIX 2: Return JSON error response
    return NextResponse.json(
      {
        success: false,
        message: "Bad Request: Invalid JSON body",
      },
      { status: 400 }
    );
  }

  const { role: requestedRole } = body;

  if (
    !requestedRole ||
    (requestedRole !== "CANDIDATE" && requestedRole !== "RECRUITER")
  ) {
    // FIX 3: Return JSON error response
    return NextResponse.json(
      {
        success: false,
        message: "Bad Request: Invalid or missing role in body",
      },
      { status: 400 }
    );
  }

  try {
    // 3. Find the user and prepare for role update
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkId },
    });

    if (!user) {
      // FIX 4: Return JSON error response
      return NextResponse.json(
        {
          success: false,
          message: "User not found in database. Check webhook status.",
        },
        { status: 404 }
      );
    }

    // Convert string role to Prisma Role enum
    const newRole = Role[requestedRole];

    // Use a transaction to ensure both user role update and profile creation (if CANDIDATE) are atomic
    const [updatedUser] = await prisma.$transaction([
      // A. Update the user's role
      prisma.user.update({
        where: { id: user.id },
        data: { role: newRole },
        select: { id: true, role: true },
      }),

      // B. Conditional Profile Creation (CANDIDATE only)
      ...(newRole === Role.CANDIDATE
        ? [
            prisma.candidateProfile.create({
              data: {
                userId: user.id,
              },
            }),
          ]
        : []),
    ]);

    // 4. Successful Response (Already JSON)
    return NextResponse.json(
      {
        success: true,
        userId: updatedUser.id,
        role: updatedUser.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error setting role for user ${clerkId}:`, error);
    // FIX 5: Return JSON error response
    return NextResponse.json(
      {
        success: false,
        message:
          "Internal Server Error: Failed to update role or create profile.",
      },
      { status: 500 }
    );
  }
}
