import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';


export async function GET() {
  try {
    const { userId } = await auth();

    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to access this resource' },
        { status: 401 }
      );
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
      select: {
        id: true,
        clerkId: true,
        role: true,
        email: true,
        createdAt: true,
      },
    });

    // If user doesn't exist in database
    if (!user) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User not found in database' },
        { status: 404 }
      );
    }

    // If user exists but role is not set
    if (!user.role) {
      return NextResponse.json(
        { 
          message: 'User exists but role not set',
          user: {
            id: user.id,
            clerkId: user.clerkId,
            email: user.email,
          },
          role: null 
        },
        { status: 200 }
      );
    }

    // Return user with role
    return NextResponse.json(
      {
        message: 'User role retrieved successfully',
        user: {
          id: user.id,
          clerkId: user.clerkId,
          email: user.email,
          createdAt: user.createdAt,
        },
        role: user.role,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching user role:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching user role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}