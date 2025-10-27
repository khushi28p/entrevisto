import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Briefcase, Building2, Calendar, CheckCircle, Clock, FileText, TrendingUp } from "lucide-react";

type PageProps = {
  params: Promise<{ applicationId: string }>;
};

export default async function ApplicationDetailsPage({ params }: PageProps) {
  const { applicationId } = await params;
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

  // Fetch application with all related data
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: {
        select: {
          userId: true,
        },
      },
      jobPosting: {
        include: {
          company: {
            select: {
              name: true,
              logoUrl: true,
              industry: true,
            },
          },
        },
      },
      interviewResult: {
        select: {
          id: true,
          transcript: true,
          aiFeedback: true,
          score: true,
          createdAt: true,
        },
      },
    },
  });

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Application Not Found</h1>
          <p className="text-muted-foreground">The application you&apos;re looking for doesn&apos;t exist.</p>
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
  if (application.candidate?.userId !== user.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don&apos;t have permission to view this application.</p>
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

  const statusColors = {
    APPLIED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    INTERVIEW_SCHEDULED: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    AI_SCREENING_COMPLETE: "bg-green-500/10 text-green-500 border-green-500/20",
    REVIEWED_BY_RECRUITER: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    OFFERED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const statusText = {
    APPLIED: "Applied",
    INTERVIEW_SCHEDULED: "Interview Scheduled",
    AI_SCREENING_COMPLETE: "AI Screening Complete",
    REVIEWED_BY_RECRUITER: "Under Review",
    OFFERED: "Offer Extended",
    REJECTED: "Not Selected",
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="space-y-4 mb-8">
          <a
            href="/candidate/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
          >
            ← Back to Dashboard
          </a>
          
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground">
                {application.jobPosting.title}
              </h1>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="text-lg">{application.jobPosting.company.name}</span>
                {application.jobPosting.company.industry && (
                  <>
                    <span>•</span>
                    <span>{application.jobPosting.company.industry}</span>
                  </>
                )}
              </div>
            </div>

            <div className={`px-4 py-2 rounded-full border ${statusColors[application.status]}`}>
              <span className="text-sm font-semibold">{statusText[application.status]}</span>
            </div>
          </div>
        </div>

        {/* Application Info Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center space-x-2">
            <Briefcase className="h-5 w-5" />
            <span>Application Information</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4 ">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Applied On</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(application.appliedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(application.updatedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Results */}
        {application.interviewResult && (
          <div className="space-y-8">
            {/* Score Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Interview Performance</span>
              </h2>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-5xl font-bold ${getScoreColor(application.interviewResult.score)}`}>
                      {application.interviewResult.score}
                    </span>
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </div>
                  <p className={`text-sm font-medium mt-1 ${getScoreColor(application.interviewResult.score)}`}>
                    {getScoreLabel(application.interviewResult.score)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Interview Date</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(application.interviewResult.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Feedback */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>AI Feedback</span>
              </h2>
              
              <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-sm">
                {application.interviewResult.aiFeedback}
              </div>
            </div>

            {/* Transcript */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Interview Transcript</span>
              </h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {application.interviewResult.transcript.split('\n\n').map((message, index) => {
                  const isAI = message.startsWith('AI:');
                  const content = message.replace(/^(AI:|User:)\s*/, '');
                  
                  return (
                    <div key={index} className={`p-3 rounded-lg ${isAI ? 'bg-primary/5' : 'bg-secondary/20'}`}>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        {isAI ? 'AI Interviewer' : 'You'}
                      </p>
                      <p className="text-sm text-foreground">{content}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg mt-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Next Steps</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            {application.status === "AI_SCREENING_COMPLETE" && (
              <p>Your application is being reviewed by the recruiting team. You&apos;ll be notified of any updates.</p>
            )}
            {application.status === "REVIEWED_BY_RECRUITER" && (
              <p>Your application has been reviewed. The team will reach out if you&apos;re selected for the next round.</p>
            )}
            {application.status === "OFFERED" && (
              <p className="text-green-600 font-semibold">Congratulations! You&apos;ve received an offer. Check your email for details.</p>
            )}
            {application.status === "REJECTED" && (
              <p>Thank you for your interest. While we&apos;ve decided to move forward with other candidates for this position, we encourage you to apply for other opportunities.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}