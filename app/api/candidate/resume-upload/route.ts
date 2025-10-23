import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
// CRITICAL FIX: Use 'require' and cast to 'any' for reliable CJS interop 
// The dynamic import was causing persistent compilation errors due to conflicting module resolutions.
const pdfParser = require('pdf-parse');

// Set the config for Next.js to parse the request body as form data
export const config = {
  api: {
    // This setting tells Next.js not to handle the body automatically, 
    // allowing req.formData() to work correctly.
    bodyParser: false, 
  },
};

const MAX_FILE_SIZE_MB = 5;

/**
 * Handles the POST request for resume upload.
 * It reads the PDF, parses its text content, and saves it to the CandidateProfile.
 */
export async function POST(req: Request) {
  // NOTE: pdfParser is imported using require() above.
  
  // 1. Authentication
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ success: false, message: 'Unauthorized: User not authenticated.' }, { status: 401 });
  }

  try {
    // 2. Parse Form Data
    const formData = await req.formData();
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
    
    // 5. Parse PDF Text Content - using the required pdfParser
    let resumeText = '';
    try {
        const data = await pdfParser(fileBuffer);
        resumeText = data.text;
    } catch (parseError) {
        // CRITICAL LOGGING ADDED HERE: Report exactly what the parser said
        console.error('PDF Parsing Failed:', (parseError as Error).message);
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to extract text from PDF. Is your resume text-selectable?' 
        }, { status: 400 });
    }
    
    if (resumeText.length < 100) {
        return NextResponse.json({ success: false, message: 'Parsed resume text is too short. Please ensure your PDF is correctly formatted and contains enough content.' }, { status: 400 });
    }

    // 6. Authorize and Find Profile
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
    
    // 7. Save Text to CandidateProfile
    await prisma.candidateProfile.update({
        where: { id: candidateProfileId },
        data: {
            resumeText: resumeText,
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
    // This catch block handles errors outside of PDF parsing (like Auth, DB connection, or unknown file stream issues)
    console.error('Resume Upload/Critical Internal Error:', (error as Error).message);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal Server Error: An unexpected error occurred during processing.' 
    }, { status: 500 });
  }
}
