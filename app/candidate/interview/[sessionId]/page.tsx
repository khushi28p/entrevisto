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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Session Not Found</h1>
          <p className="text-muted-foreground">The interview session you're looking for doesn't exist.</p>
          <a
            href="/candidate/practice"
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Practice
          </a>
        </div>
      </div>
    );
  }

  // Verify ownership
  if (session.candidateProfile?.userId !== user.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to view this session.</p>
          <a
            href="/candidate/practice"
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Practice
          </a>
        </div>
      </div>
    );
  }

  const resumeText = session.candidateProfile?.resumeText || "No resume available";

  const systemInstruction = `
# Role & Objective
You are an AI Interviewer for a hiring platform. 
Your goal is to conduct a short, context-based interview using the candidate's resume. 
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

# Reference Pronunciations
- "Vapi" → "Vaa-pee"
- "AI" → "Aye-eye"
- "Resume" → "Reh-zoo-may"

If unclear about any term or name in the resume, politely ask the candidate for clarification.

# Tools
You have access to:
- Speech recognition and TTS for real-time interviewing.
- OpenAI GPT model for reasoning and question generation.
You cannot browse the internet or access external APIs. 
Use only the provided resume and candidate responses for context.

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
1. **Greeting:** Welcome the candidate and confirm readiness.
2. **Resume-Based Questions:** Ask 2–3 questions about their skills, projects, or experience.
3. **Follow-Ups:** Ask simple follow-ups to clarify or expand their answers.
4. **Closing:** Offer short, constructive feedback and thank them for participating.

**Example Flow:**
- "Hi! Nice to meet you! I see you've worked with React and TypeScript — could you tell me about a project where you used them together?"
- "That sounds great. What was the most challenging part of that project?"
- "Thank you for sharing that — you explained it really clearly. I appreciate your time today!"

# Safety & Escalation
- If the user seems uncomfortable or unresponsive: 
  "Would you like to pause or end the interview for now?"
- If the user goes off-topic:
  "Let's stay focused on your experience and background for now."
- If the resume is missing or unclear:
  "I don't seem to have full details of your background — could you briefly describe your experience?"
- Always remain polite, calm, and professional, even if the candidate is frustrated or confused.
  `;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto pt-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b border-border pb-6">
          <h1 className="text-3xl font-bold text-primary">AI Interview Session</h1>
          <p className="text-muted-foreground">Practice Interview Mode</p>
          <p className="text-sm text-muted-foreground">Session ID: {sessionId}</p>
        </div>

        {/* Instructions Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-foreground mb-3">Interview Instructions</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Click the microphone button below to start the interview</li>
            <li>• The AI will ask you questions based on your resume</li>
            <li>• Speak clearly and naturally</li>
            <li>• The interview will last approximately 2 minutes</li>
            <li>• You'll receive feedback after completing the interview</li>
          </ul>
        </div>

        {/* Vapi Widget */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <VapiWidget
            assistantId={process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID as string}
            sessionId={sessionId}
            config={{
              model: {
                provider: "openai",
                model: "gpt-4o-realtime-preview-2024-12-17",
                messages: [
                  {
                    role: "system",
                    content: systemInstruction,
                  },
                ],
                temperature: 0.7,
              },
              firstMessage: "Hello! I'm ready to begin your practice interview. Are you ready to start?",
              voice: {
                provider: "openai",
                voiceId: "alloy",
              },
            }}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-center pt-4">
          <a
            href="/candidate/practice"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Practice Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}