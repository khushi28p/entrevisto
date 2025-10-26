import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { VapiClient } from '@vapi-ai/server-sdk'; 
import { InterviewSessionType, ApplicationStatus } from '@prisma/client';

// NOTE: VapiClient setup is identical to your working Vapi Launch API
if (!process.env.VAPI_API_KEY) {
    console.error('CRITICAL: VAPI_API_KEY environment variable is not set!');
}
const vapi = new VapiClient({
    token: process.env.VAPI_API_KEY || 'YOUR_VAPI_TEST_KEY',
});

// Shared base configuration for the Vapi Assistant payload
const INTERVIEW_ASSISTANT_BASE: any = {
    model: { provider: "openai", model: "gpt-4o", temperature: 0.7 },
    voice: { provider: "openai", voiceId: "cedar" }, 
    transcriber: { provider: "deepgram", model: "nova-2", language: "en-US" },
    endCallFunctionEnabled: true,
    recordingEnabled: true,
    serverUrl: `${process.env.NEXT_PUBLIC_BASE_URL?.replace('http://', 'https://')}/api/webhooks/vapi`,
};

export async function POST(req: Request) {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

    const { jobId, sessionType } = await req.json();
    if (!jobId || sessionType !== 'APPLICATION') {
        return NextResponse.json({ success: false, message: 'Invalid request parameters.' }, { status: 400 });
    }

    try {
        // 1. Fetch Candidate Data and validate profile/resume
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, firstName: true, candidateProfile: { select: { id: true, resumeText: true } } },
        });

        const resumeText = user?.candidateProfile?.resumeText;
        const candidateProfileId = user?.candidateProfile?.id;
        
        if (!resumeText || resumeText.length < 100 || !candidateProfileId) {
            return NextResponse.json({ success: false, message: 'Resume text is missing or too short. Please upload your resume first.' }, { status: 400 });
        }
        
        // 2. Check for existing active application for this job
        const existingApplication = await prisma.application.findFirst({
            where: { candidateId: candidateProfileId, jobPostingId: jobId },
        });
        
        if (existingApplication) {
            return NextResponse.json({ success: false, message: 'You have an existing application for this job.' }, { status: 409 });
        }
        
        // 3. Create the Application record
        const application = await prisma.application.create({
            data: {
                candidateId: candidateProfileId,
                jobPostingId: jobId,
                status: ApplicationStatus.INTERVIEW_SCHEDULED, // Set status before interview completion
            }
        });
        
        // 4. Create the InterviewResult record (linked to the Application)
        const interviewSession = await prisma.interviewResult.create({
            data: {
                applicationId: application.id, // CRITICAL: Link to Application
                sessionType: InterviewSessionType.APPLICATION,
                vapiCallId: 'TEMP-' + Date.now().toString() + Math.random().toString(36).substring(2, 9),
                transcript: '', 
                aiFeedback: '', 
                score: 0.0,
            }
        });
        
        // 5. Build and Launch Vapi Call
        const systemPrompt = "Act as a specialized technical recruiter for the role, asking questions based on the resume and job requirements."; // Simplified for space
        const firstMessage = `Hello ${user?.firstName || 'Candidate'}, this is the official screening interview for the ${jobId} position. Please begin.`;
        
        const call: any = await vapi.calls.create({
            assistant: {
                ...INTERVIEW_ASSISTANT_BASE,
                model: {
                    ...INTERVIEW_ASSISTANT_BASE.model,
                    messages: [{ role: "system", content: systemPrompt }, { role: "assistant", content: firstMessage }],
                },
                metadata: {
                    interviewResultId: interviewSession.id, // CRITICAL: Prisma DB ID
                    sessionType: InterviewSessionType.APPLICATION,
                } as any,
            } as any,
        });

        // 6. Update Prisma record with the official Vapi Call ID
        await prisma.interviewResult.update({
            where: { id: interviewSession.id },
            data: { vapiCallId: call.id },
        });

        return NextResponse.json({ 
            success: true, 
            sessionId: call.id, 
            interviewResultId: interviewSession.id 
        }, { status: 200 });

    } catch (error) {
        console.error('Application Launch Critical Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error during application launch.' }, { status: 500 });
    }
}
