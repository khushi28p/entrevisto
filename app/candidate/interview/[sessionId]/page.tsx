// app/candidate/interview/[sessionId]/page.tsx

import VapiWidget from "@/components/vapi-widget";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function InterviewPage({ params }: PageProps) {
  const { sessionId } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch interview session with all related data
  const session = await prisma.interviewResult.findUnique({
    where: { id: sessionId },
    include: {
      candidateProfile: {
        select: {
          userId: true,
          resumeText: true,
        },
      },
      application: {
        include: {
          jobPosting: {
            include: {
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Session Not Found</h1>
          <p className="text-muted-foreground">The interview session you're looking for doesn't exist.</p>
          <a
            href="/candidate/dashboard"
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Verify ownership
  if (session.candidateProfile?.userId !== user.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to view this session.</p>
          <a
            href="/candidate/dashboard"
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const resumeText = session.candidateProfile?.resumeText || "No resume available";
  const isPracticeMode = session.sessionType === "PRACTICE";
  const isApplicationMode = session.sessionType === "APPLICATION";

  // Build system instruction based on session type
  let systemInstruction = "";

  if (isPracticeMode) {
    systemInstruction = `
# Role & Objective
You are an AI Interviewer for a hiring platform. 
Your goal is to conduct a short, context-based practice interview using the candidate's resume. 
You must ask intelligent, tailored questions that reflect the candidate's background and skills.
Success means completing a focused, friendly, and professional interview in about 2 minutes.

# Personality & Tone
- Professional, warm, and conversational.
- Confident but approachable — sound like an experienced recruiter.
- Avoid robotic or overly formal phrasing.
- Maintain curiosity and empathy while keeping responses concise.

# Context
Candidate's resume text:
${resumeText}

This resume contains the candidate's education, experience, and skills. 
Use it to personalize your questions and conversation. 
Do not repeat the resume verbatim — interpret it naturally and infer context when needed.

# Instructions / Rules
✅ DO:
- Greet the candidate and confirm readiness.
- Ask 3–5 relevant, resume-based questions.
- Ask natural follow-ups to short or vague answers.
- Keep the session within roughly 2 minutes.
- End with polite appreciation and brief verbal feedback.

❌ DON'T:
- Don't ask about personal or sensitive topics (age, gender, religion, etc.).
- Don't repeat the resume word-for-word.
- Don't make assumptions or judgments.
- Don't exceed the 2-minute goal.

# Conversation Flow
1. **Greeting:** Welcome the candidate and confirm readiness for practice.
2. **Resume-Based Questions:** Ask 2–3 questions about their skills, projects, or experience.
3. **Follow-Ups:** Ask simple follow-ups to clarify or expand their answers.
4. **Closing:** Offer short, constructive feedback and thank them for practicing.
`;
  } else if (isApplicationMode && session.application) {
    const job = session.application.jobPosting;
    systemInstruction = `
# Role & Objective
You are an AI Interviewer conducting a real job application screening for ${job.company.name}.
Position: ${job.title}
Your goal is to assess if the candidate is a good fit for this specific role based on their resume and responses.
This is a formal interview that will determine if they move forward in the hiring process.

# Personality & Tone
- Professional, thorough, and evaluative.
- Warm but focused — this is a real interview, not practice.
- Ask probing questions to assess skill fit and cultural alignment.
- Take notes mentally to provide comprehensive feedback.

# Context

**Candidate's Resume:**
${resumeText}

**Job Position:** ${job.title}

**Job Description:**
${job.description}

**Key Requirements:**
${job.requirements}

# Instructions / Rules
✅ DO:
- Greet professionally and explain this is the screening interview for ${job.title}.
- Ask 4-6 targeted questions specifically related to the job requirements.
- Probe for specific examples and achievements relevant to the role.
- Assess technical skills, experience level, and cultural fit.
- Keep the interview between 3-5 minutes.
- End professionally and inform them they'll receive feedback through the platform.

❌ DON'T:
- Don't ask about personal or sensitive topics (age, gender, religion, etc.).
- Don't reveal your assessment during the interview.
- Don't make hiring promises or discuss salary.

# Conversation Flow
1. **Opening:** "Hello! I'm conducting the AI screening interview for the ${job.title} position at ${job.company.name}. Are you ready to begin?"
2. **Requirements Assessment:** Ask questions directly tied to the job requirements listed above.
3. **Experience Deep-Dive:** Probe into relevant experience from their resume.
4. **Closing:** "Thank you for your time. You'll receive detailed feedback and next steps through the platform within 24 hours."

# Evaluation Criteria
Mentally assess:
- Technical skill match (how well do their skills align with requirements?)
- Experience relevance (do they have relevant background?)
- Communication clarity (can they articulate their thoughts well?)
- Problem-solving approach (do they provide concrete examples?)
- Cultural fit indicators (professionalism, enthusiasm, team orientation)
`;
  }

  const redirectPath = isPracticeMode 
    ? `/candidate/practice/feedback/${sessionId}`
    : `/candidate/applications/${session.applicationId}`;

  const pageTitle = isPracticeMode 
    ? "Practice Interview Session"
    : `Interview: ${session.application?.jobPosting.title}`;

  const pageSubtitle = isPracticeMode
    ? "Practice Interview Mode"
    : `${session.application?.jobPosting.company.name} - Job Application Screening`;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b border-border pb-6 mb-8">
          <h1 className="text-3xl font-bold text-primary">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageSubtitle}</p>
          <p className="text-sm text-muted-foreground">Session ID: {sessionId}</p>
        </div>

        {/* Instructions Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">Interview Instructions</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Click the microphone button below to start the interview</li>
            <li>• The AI will ask you questions based on {isApplicationMode ? 'the job requirements and ' : ''}your resume</li>
            <li>• Speak clearly and provide specific examples</li>
            <li>• The interview will last approximately {isPracticeMode ? '2' : '3-5'} minutes</li>
            <li>• You'll receive {isApplicationMode ? 'detailed evaluation ' : ''}feedback after completing the interview</li>
          </ul>
        </div>

        {/* Vapi Widget */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg mb-8">
          <VapiWidget
            assistantId={process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID as string}
            sessionId={sessionId}
            redirectOnEnd={redirectPath}
            config={{
              model: {
                provider: "openai",
                model: "gpt-realtime-2025-08-28",
                messages: [
                  {
                    role: "system",
                    content: systemInstruction,
                  },
                ],
                temperature: 0.7,
              },
              firstMessage: isApplicationMode 
                ? `Hello! I'm conducting the AI screening interview for the ${session.application?.jobPosting.title} position at ${session.application?.jobPosting.company.name}. Are you ready to begin?`
                : "Hello! I'm ready to begin your practice interview. Are you ready to start?",
              voice: {
                provider: "openai",
                voiceId: "cedar",
              },
            }}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-center">
          <a
            href={isPracticeMode ? "/candidate/practice" : "/candidate/dashboard"}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to {isPracticeMode ? "Practice" : "Applications"}
          </a>
        </div>
      </div>
    </div>
  );
}