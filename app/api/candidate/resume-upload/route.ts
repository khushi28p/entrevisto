import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { put } from '@vercel/blob'; // Import Vercel Blob put function
import {PDFParse} from 'pdf-parse';
// CRITICAL FIX: Use the new v2 PDFParse destructuring
// NOTE: V2 often requires the CJS destructuring pattern.

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
 * It reads the PDF, uploads it to Vercel Blob, parses its text content, 
 * and saves both the text and the document URL to the CandidateProfile.
 */
export async function POST(req: Request) {
  // 1. Authentication
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ success: false, message: 'Unauthorized: User not authenticated.' }, { status: 401 });
  }
  
  // Vercel Blob Token check
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is missing!');
      return NextResponse.json({ success: false, message: 'Server configuration error: Blob storage not configured.' }, { status: 500 });
  }


  let fileUrl: string | null = null;
  let resumeText = '';

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
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    
    // 5. Upload File to Vercel Blob
    const filename = `${clerkId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const blob = await put(filename, fileBuffer, {
        access: 'public', // Set access level appropriate for your use case
    });
    fileUrl = blob.url;


    // 6. Parse PDF Text Content - using the new v2 PDFParse class
    try {
        // Initialize PDFParse with the buffer option (v2 standard)
        const parser = new PDFParse({ buffer: fileBuffer });
        const data = await parser.getText(); 
        resumeText = data.text;
    } catch (parseError) {
        console.error('PDF Parsing Failed:', (parseError as Error).message);
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to extract text from PDF. Ensure your resume is text-selectable.' 
        }, { status: 400 });
    }
    
    if (resumeText.length < 100) {
        return NextResponse.json({ success: false, message: 'Parsed resume text is too short. Please ensure your PDF is correctly formatted and contains enough content.' }, { status: 400 });
    }

    // 7. Authorize and Find Profile
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
    
    // 8. Save Text and URL to CandidateProfile
    await prisma.candidateProfile.update({
        where: { id: candidateProfileId },
        data: {
            resumeText: resumeText,
            resumeDocumentUrl: fileUrl, // Save the Vercel Blob URL
            lastResumeUpdate: new Date(),
        },
    });

    // 9. Success Response
    return NextResponse.json({ 
      success: true, 
      message: 'Resume uploaded, analyzed, and saved successfully.',
      textLength: resumeText.length,
      fileUrl: fileUrl
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
