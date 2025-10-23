import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
// NOTE: We will dynamically import pdf-parse inside the POST function to fix the default export issue.
// import pdf from 'pdf-parse'; // REMOVED THIS LINE

// Set the config for Next.js to parse the request body as form data
export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE_MB = 5;

/**
 * Handles the POST request for resume upload.
 * It reads the PDF, parses its text content, and saves it to the CandidateProfile.
 */
export async function POST(req: Request) {
  // Fix: Dynamically import pdf-parse and handle CJS/ESM interop
  const pdfModule = await import('pdf-parse');
  // Use the default export if available, otherwise use the module root (common CJS interop fix)
  const pdfParser = (pdfModule as any).default || pdfModule; 
  
  // 1. Authentication
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ success: false, message: 'Unauthorized: User not authenticated.' }, { status: 401 });
  }

  try {
    // 2. Parse Form Data
    const formData = await req.formData();
    // File object in Next.js runtime is often mapped to Blob, which satisfies the File type for formData.get()
    const file = formData.get('resume') as File | null; 

    if (!file) {
      return NextResponse.json({ success: false, message: 'Bad Request: Resume file not found in form data.' }, { status: 400 });
    }

    // 3. Validation
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ success: false, message: 'Invalid file type. Only PDF files are supported.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ success: false, message: `File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.` }, { status: 400 });
    }

    // 4. Read File Content into Buffer
    // Convert the Web File API Blob/File into an ArrayBuffer, then into a Node.js Buffer
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    
    // 5. Parse PDF Text Content - using the dynamically imported pdfParser
    const data = await pdfParser(fileBuffer);
    const resumeText = data.text;
    
    if (resumeText.length < 100) {
        return NextResponse.json({ success: false, message: 'Parsed resume text is too short. Ensure your PDF is text-selectable.' }, { status: 400 });
    }

    // 6. Authorize and Find Profile
    // We fetch the user to ensure they are a CANDIDATE and get their CandidateProfile ID
    const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { 
            role: true, 
            id: true,
            candidateProfile: { select: { id: true } }
        },
    });

    if (!user || user.role !== Role.CANDIDATE || !user.candidateProfile?.id) {
        return NextResponse.json({ success: false, message: 'Authorization failed. User must be a Candidate with a profile.' }, { status: 403 });
    }
    
    const candidateProfileId = user.candidateProfile.id;
    
    // 7. Save Text and optional document URL to CandidateProfile
    await prisma.candidateProfile.update({
        where: { id: candidateProfileId },
        data: {
            resumeText: resumeText,
            // Optionally, save the document URL if you use a storage service like S3/Vercel Blob
            // resumeDocumentUrl: "https://your-storage.com/...", 
            lastResumeUpdate: new Date(),
        },
    });

    // 8. Success Response
    return NextResponse.json({ 
      success: true, 
      message: 'Resume analyzed and saved successfully.',
      textLength: resumeText.length
    }, { status: 200 });

  } catch (error) {
    console.error('Resume Upload/Parsing Critical Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal Server Error: Failed to process resume file.' 
    }, { status: 500 });
  }
}
