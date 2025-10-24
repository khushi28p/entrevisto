import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { put, del } from '@vercel/blob'; 
import PDFParser from 'pdf2json';

const MAX_FILE_SIZE_MB = 5;

async function parsePdfToText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1); // null, 1 for better text extraction
    
    pdfParser.on('pdfParser_dataError', (errData: any) => {
      console.error('PDF Parser Error:', errData.parserError);
      reject(new Error('Failed to parse PDF'));
    });
    
    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      try {
        // Extract text from all pages
        let text = '';
        
        if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
          pdfData.Pages.forEach((page: any) => {
            if (page.Texts && Array.isArray(page.Texts)) {
              page.Texts.forEach((textItem: any) => {
                if (textItem.R && Array.isArray(textItem.R)) {
                  textItem.R.forEach((r: any) => {
                    if (r.T) {
                      // Decode URI component to get actual text
                      text += decodeURIComponent(r.T) + ' ';
                    }
                  });
                }
              });
              text += '\n'; // New line after each page
            }
          });
        }
        
        // Fallback to getRawTextContent if structured extraction fails
        if (text.trim().length === 0) {
          text = pdfParser.getRawTextContent();
        }
        
        // Clean up and format the text
        text = text
          // Fix common formatting issues
          .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
          .replace(/([a-zA-Z])(\d)/g, '$1 $2') // Add space between letters and numbers
          .replace(/(\d)([a-zA-Z])/g, '$1 $2') // Add space between numbers and letters
          .replace(/([a-z])([A-Z][a-z])/g, '$1 $2') // Better camelCase handling
          // Clean whitespace
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/\s*([•·○▪■◆])\s*/g, '\n$1 ') // Format bullet points with newlines
          .replace(/([.!?])\s+/g, '$1\n') // New line after sentences
          .replace(/\n\s*\n+/g, '\n\n') // Normalize multiple newlines to double
          // Fix common concatenations
          .replace(/([a-z])\|/g, '$1 | ') // Space around pipes
          .replace(/\|([a-z])/g, ' | $1')
          .replace(/,([A-Z])/g, ', $1') // Space after commas before capitals
          .replace(/([a-z])–/g, '$1 – ') // Space around dashes
          .replace(/–([a-z])/g, ' – $1')
          .trim();
        
        console.log('Extracted text length:', text.length);
        console.log('First 300 chars:', text.substring(0, 300));
        
        resolve(text);
      } catch (error) {
        console.error('Error processing PDF data:', error);
        reject(new Error('Failed to process PDF content'));
      }
    });
    
    // Parse buffer directly (no temp file needed)
    pdfParser.parseBuffer(buffer);
  });
}

/**
 * Handles the POST request for resume upload.
 */
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ 
      success: false, 
      message: 'Unauthorized: User not authenticated.' 
    }, { status: 401 });
  }
  
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN is missing!');
    return NextResponse.json({ 
      success: false, 
      message: 'Server configuration error: Blob storage not configured.' 
    }, { status: 500 });
  }

  let fileUrl: string | null = null;
  let resumeText = '';

  try {
    // Parse Form Data
    const formData = await req.formData();
    const file = formData.get('resume') as File | null; 

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: 'Bad Request: Resume file not found in form data.' 
      }, { status: 400 });
    }

    // Validation
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid file type. Only PDF files are supported.' 
      }, { status: 400 });
    }
    
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        message: `File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.` 
      }, { status: 400 });
    }

    // Read File Content
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    
    // Parse PDF Text Content FIRST (before uploading to blob)
    try {
      resumeText = await parsePdfToText(fileBuffer);
    } catch (parseError) {
      console.error('PDF Parsing Failed:', parseError);
      
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to extract text from PDF. Ensure your resume is text-selectable (not a scanned image).' 
      }, { status: 400 });
    }
    
    // Check text length
    if (resumeText.length < 100) {
      return NextResponse.json({ 
        success: false, 
        message: 'Parsed resume text is too short. Your PDF may be a scanned image or improperly formatted. Please upload a text-based PDF.' 
      }, { status: 400 });
    }

    // Upload to Vercel Blob (only after successful parsing)
    const filename = `${clerkId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const blob = await put(filename, fileBuffer, {
      access: 'public',
    });
    fileUrl = blob.url;

    // Authorize and Find User
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { 
        role: true, 
        id: true,
        candidateProfile: { select: { id: true, resumeDocumentUrl: true } }
      },
    });

    if (!user || user.role !== Role.CANDIDATE) {
      // Cleanup blob
      if (fileUrl) {
        try {
          await del(fileUrl);
        } catch (delError) {
          console.error('Failed to cleanup blob:', delError);
        }
      }
      
      return NextResponse.json({ 
        success: false, 
        message: 'Authorization failed. User must be a Candidate.' 
      }, { status: 403 });
    }
    
    const oldResumeUrl = user.candidateProfile?.resumeDocumentUrl;
    
    // Upsert to Database (creates profile if doesn't exist, updates if it does)
    await prisma.candidateProfile.upsert({
      where: { userId: user.id },
      update: {
        resumeText: resumeText,
        resumeDocumentUrl: fileUrl,
        lastResumeUpdate: new Date(),
      },
      create: {
        userId: user.id,
        resumeText: resumeText,
        resumeDocumentUrl: fileUrl,
        lastResumeUpdate: new Date(),
      },
    });

    // Delete old resume blob if it exists
    if (oldResumeUrl) {
      try {
        await del(oldResumeUrl);
      } catch (delError) {
        console.error('Failed to delete old resume:', delError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Resume uploaded, analyzed, and saved successfully.',
      textLength: resumeText.length,
      fileUrl: fileUrl
    }, { status: 200 });

  } catch (error) {
    console.error('Resume Upload Critical Error:', error);
    
    // Cleanup blob on critical error
    if (fileUrl) {
      try {
        await del(fileUrl);
      } catch (delError) {
        console.error('Failed to cleanup blob on error:', delError);
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Internal Server Error: An unexpected error occurred.' 
    }, { status: 500 });
  }
}