import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  FileText, 
  MessageSquare,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Download
} from "lucide-react";
import { ApplicationActionButtons } from "@/components/application-action-buttons";

type PageProps = {
  params: Promise<{ applicationId: string }>;
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    APPLIED: { color: "bg-blue-500/10 text-blue-500", label: "Applied" },
    INTERVIEW_SCHEDULED: { color: "bg-purple-500/10 text-purple-500", label: "Interview Scheduled" },
    AI_SCREENING_COMPLETE: { color: "bg-green-500/10 text-green-500", label: "Screening Complete" },
    REVIEWED_BY_RECRUITER: { color: "bg-orange-500/10 text-orange-500", label: "Under Review" },
    OFFERED: { color: "bg-emerald-500/10 text-emerald-500", label: "Offered" },
    REJECTED: { color: "bg-red-500/10 text-red-500", label: "Rejected" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.APPLIED;

  return (
    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
};

// Score Display Component
const ScoreDisplay = ({ score }: { score: number }) => {
  const getScoreColor = () => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const getScoreLabel = () => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  return (
    <div className="flex items-center justify-between p-6 bg-card border border-border rounded-xl">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Interview Score</p>
        <p className="text-sm font-medium text-muted-foreground">{getScoreLabel()}</p>
      </div>
      <div className={`text-5xl font-bold ${getScoreColor()}`}>
        {Math.round(score)}
        <span className="text-2xl text-muted-foreground">/100</span>
      </div>
    </div>
  );
};

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { applicationId } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  // Verify recruiter role
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { 
      role: true,
      recruiterProfile: {
        select: { companyId: true }
      }
    },
  });

  if (!user || user.role !== "RECRUITER") {
    redirect("/candidate/dashboard");
  }

  // Fetch application with all related data
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: {
        include: {
          user: {
            select: {
              email: true,
              createdAt: true
            }
          }
        }
      },
      jobPosting: {
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      interviewResult: true
    }
  });

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Application Not Found</h1>
          <p className="text-muted-foreground">The application you're looking for doesn't exist.</p>
          <Link
            href="/recruiter/dashboard"
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Verify the application belongs to recruiter's company
  if (application.jobPosting.company.id !== user.recruiterProfile?.companyId) {
    redirect("/recruiter/dashboard");
  }

  // Check if application is already processed
  const isProcessed = application.status === 'OFFERED' || application.status === 'REJECTED';

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8 pt-8">
        
        {/* Header */}
        <div className="space-y-4">
          <Link
            href={`/recruiter/jobs/${application.jobPostingId}`}
            className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Job</span>
          </Link>

          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground">Application Details</h1>
              <p className="text-lg text-muted-foreground">
                {application.jobPosting.title} at {application.jobPosting.company.name}
              </p>
            </div>
            <StatusBadge status={application.status} />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Left Column - Candidate Info */}
          <div className="md:col-span-1 space-y-6">
            
            {/* Candidate Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-foreground flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Candidate</span>
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{application.candidate.user.email}</span>
                </div>
                
                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Applied {new Date(application.appliedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Member since {new Date(application.candidate.user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Resume Section */}
              {application.candidate.resumeDocumentUrl && (
                <div className="pt-4 border-t border-border">
                  <a
                    href={application.candidate.resumeDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 w-full py-2 px-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-sm font-medium">Download Resume</span>
                  </a>
                </div>
              )}
            </div>

            {/* Interview Score Card */}
            {application.interviewResult && (
              <ScoreDisplay score={application.interviewResult.score} />
            )}

          </div>

          {/* Right Column - Interview Details */}
          <div className="md:col-span-2 space-y-6">
            
            {application.interviewResult ? (
              <>
                {/* AI Feedback */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>AI Evaluation</span>
                  </h2>
                  <div className="prose prose-sm max-w-none text-secondary-foreground whitespace-pre-wrap leading-relaxed">
                    {application.interviewResult.aiFeedback}
                  </div>
                </div>

                {/* Interview Transcript */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Interview Transcript</span>
                  </h2>
                  <div className="bg-secondary/20 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                    <pre className="text-sm text-secondary-foreground whitespace-pre-wrap font-mono leading-relaxed">
                      {application.interviewResult.transcript}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Interview Pending</h3>
                <p className="text-sm text-muted-foreground">
                  The candidate hasn't completed the AI screening interview yet.
                </p>
              </div>
            )}

            {/* Resume Text Preview */}
            {application.candidate.resumeText && (
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Resume Content</span>
                </h2>
                <div className="bg-secondary/20 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  <div className="text-sm text-secondary-foreground whitespace-pre-wrap leading-relaxed">
                    {application.candidate.resumeText}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Only show if not already processed */}
            {!isProcessed && (
              <ApplicationActionButtons applicationId={applicationId} />
            )}

            {/* Show message if already processed */}
            {isProcessed && (
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  This application has been {application.status === 'OFFERED' ? 'accepted' : 'rejected'}.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}