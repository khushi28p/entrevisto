// app/api/user/set-role/route.ts
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

interface RequestBody {
  role: "CANDIDATE" | "RECRUITER";
}

export async function POST(req: Request) {
  console.log("request reached");
  
  // 1. Authenticate the user
  const { userId: clerkId } = await auth();

  if (!clerkId) {
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
    console.error("Error: ", error);
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
    return NextResponse.json(
      {
        success: false,
        message: "Bad Request: Invalid or missing role in body",
      },
      { status: 400 }
    );
  }

  try {
    // 3. Find or create the user
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkId },
    });

    // If user doesn't exist, create them (webhook might be delayed)
    if (!user) {
      console.log(`User not found in DB. Fetching from Clerk and creating...`);
      
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(clerkId);
        
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        
        if (!email) {
          return NextResponse.json(
            { success: false, message: "Could not retrieve user email from Clerk" },
            { status: 400 }
          );
        }

        user = await prisma.user.create({
          data: {
            clerkId: clerkId,
            email: email,
            role: "CANDIDATE", // temporary default
          },
        });
        
        console.log(`User created with ID: ${user.id}`);
      } catch (clerkError) {
        console.error("Failed to fetch user from Clerk:", clerkError);
        return NextResponse.json(
          { success: false, message: "Failed to retrieve user information" },
          { status: 500 }
        );
      }
    }

    // 4. Convert string role to Prisma Role enum
    const newRole = Role[requestedRole];

    // 5. Update role and handle profile creation
    if (newRole === Role.CANDIDATE) {
      const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { role: newRole },
          select: { id: true, role: true },
        }),
        prisma.candidateProfile.upsert({
          where: { userId: user.id },
          update: {}, // No updates if exists
          create: { userId: user.id },
        }),
      ]);
      
      return NextResponse.json({
        success: true,
        userId: updatedUser.id,
        role: updatedUser.role,
      }, { status: 200 });
    } else {
      // RECRUITER role - just update user
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { role: newRole },
        select: { id: true, role: true },
      });
      
      return NextResponse.json({
        success: true,
        userId: updatedUser.id,
        role: updatedUser.role,
      }, { status: 200 });
    }

  } catch (e: unknown) {
    console.error(`Error setting role for user ${clerkId}:`, e);
    
    // Handle specific Prisma errors
    if (e.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          message: "Profile already exists for this user",
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error: Failed to update role or create profile.",
      },
      { status: 500 }
    );
  }
}