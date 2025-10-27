import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import {
  Briefcase,
  BrainCircuit,
  Users,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

// Stats Card Component
const StatCard = ({
  icon: Icon,
  label,
  value,
  color = "text-primary",
}: {
  icon: any;
  label: string;
  value: string | number;
  color?: string;
}) => (
  <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
    <div className="flex items-center space-x-3">
      <div className={`p-3 rounded-lg bg-${color.split("-")[1]}-500/10`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  </div>
);

// Application Status Badge
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    APPLIED: { color: "bg-blue-500/10 text-blue-500", label: "Applied" },
    AI_SCREENING_COMPLETE: {
      color: "bg-green-500/10 text-green-500",
      label: "Screening Done",
    },
    REVIEWED_BY_RECRUITER: {
      color: "bg-orange-500/10 text-orange-500",
      label: "Under Review",
    },
    OFFERED: { color: "bg-emerald-500/10 text-emerald-500", label: "Offered" },
    REJECTED: { color: "bg-red-500/10 text-red-500", label: "Not Selected" },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.APPLIED;

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full ${config.color}`}
    >
      {config.label}
    </span>
  );
};

// Application Card Component
const ApplicationCard = ({
  application,
}: {
  application: {
    id: string;
    status: string;
    appliedAt: Date;
    jobPosting: {
      title: string;
      company: { name: string };
    };
    interviewResult: {
      score: number;
    } | null;
  };
}) => (
  <Link
    href={`/candidate/applications/${application.id}`}
    className="group block p-4 bg-card border border-border rounded-lg hover:shadow-md transition-all duration-200"
  >
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1">
        <h4 className="font-semibold text-foreground group-hover:text-chart-2 transition-colors">
          {application.jobPosting.title}
        </h4>
        <p className="text-sm text-muted-foreground">
          {application.jobPosting.company.name}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
    </div>

    <div className="flex items-center justify-between mt-3">
      <StatusBadge status={application.status} />
      <div className="text-xs text-muted-foreground flex items-center space-x-1">
        <Clock className="h-3 w-3" />
        <span>{new Date(application.appliedAt).toLocaleDateString()}</span>
      </div>
    </div>

    {application.interviewResult && (
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Interview Score</span>
          <span className="text-sm font-bold text-chart-2">
            {application.interviewResult.score}/100
          </span>
        </div>
      </div>
    )}
  </Link>
);

// Job Listing Card
const JobListingCard = ({
  job,
}: {
  job: {
    id: string;
    title: string;
    company: { name: string };
    description: string;
    requirements: string;
  };
}) => {
  const requirementsList = job.requirements
    .split(",")
    .slice(0, 3)
    .map((r) => r.trim());

  return (
    <Link
      href={`/candidate/apply/${job.id}`}
      className="group block p-6 bg-card border border-border rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:border-chart-2/80"
    >
      <div className="flex justify-between items-start">
        <h4 className="text-xl font-serif font-bold text-foreground group-hover:text-chart-2">
          {job.title}
        </h4>
        <ChevronRight className="h-6 w-6 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-chart-2" />
      </div>

      <p className="text-sm font-medium text-muted-foreground mt-1 mb-4 flex items-center space-x-1">
        <Briefcase className="h-4 w-4" />
        <span>{job.company.name}</span>
      </p>

      <p className="text-sm text-secondary-foreground line-clamp-2">
        {job.description}
      </p>

      <div className="mt-4">
        <h5 className="text-xs font-semibold uppercase text-primary mb-2">
          Key Skills
        </h5>
        <div className="flex flex-wrap gap-2">
          {requirementsList.map((req, index) => (
            <span
              key={index}
              className="px-3 py-1 text-xs font-medium bg-chart-2/10 text-chart-2 rounded-full"
            >
              {req}
            </span>
          ))}
          {requirementsList.length === 3 && (
            <span className="px-3 py-1 text-xs font-medium bg-chart-2/10 text-chart-2 rounded-full">
              ...
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

// Practice Card
const PracticeCard = () => (
  <div className="p-8 bg-gradient-to-br from-chart-2/10 to-chart-2/5 border-2 border-chart-2/30 rounded-xl shadow-lg">
    <BrainCircuit className="h-12 w-12 text-chart-2 mb-4" />
    <h3 className="text-2xl font-serif font-bold text-secondary-foreground">
      AI Interview Practice
    </h3>
    <p className="text-muted-foreground mt-2 mb-6">
      Perfect your interview skills with our AI agent. Get instant feedback.
    </p>
    <Link href="/candidate/practice">
      <button className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-chart-2 text-primary-foreground rounded-lg shadow-md hover:bg-chart-2/90 transition-colors font-semibold">
        <BrainCircuit className="h-5 w-5" />
        <span>Start Practice</span>
      </button>
    </Link>
  </div>
);

export default async function CandidateDashboardPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  // Fetch user with all related data
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      role: true,
      email: true,
      candidateProfile: {
        select: {
          id: true,
          resumeText: true,
          applications: {
            select: {
              id: true,
              status: true,
              appliedAt: true,
              jobPosting: {
                select: {
                  title: true,
                  company: { select: { name: true } },
                },
              },
              interviewResult: {
                select: {
                  score: true,
                },
              },
            },
            orderBy: { appliedAt: "desc" },
            take: 5,
          },
          interviewResults: {
            where: { sessionType: "PRACTICE" },
            select: { score: true },
          },
        },
      },
    },
  });

  if (!user || user.role !== Role.CANDIDATE) {
    redirect(user ? "/recruiter/dashboard" : "/select-role");
  }

  // Fetch active jobs
  const activeJobs = await prisma.jobPosting.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      description: true,
      requirements: true,
      company: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const hasResume = !!user.candidateProfile?.resumeText;
  const applications = user.candidateProfile?.applications || [];
  const practiceInterviews = user.candidateProfile?.interviewResults || [];

  // Calculate average practice score
  const avgScore =
    practiceInterviews.length > 0
      ? Math.round(
          practiceInterviews.reduce((sum, i) => sum + i.score, 0) /
            practiceInterviews.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="border-b border-border/80 pb-6 mb-8">
          <h1 className="text-4xl font-serif font-extrabold tracking-tight text-foreground">
            Welcome Back!
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Your AI-powered career dashboard
          </p>
        </header>

        {/* Resume Warning Banner */}
        {!hasResume && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start space-x-3 mb-8">
            <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-500">
                Resume Required
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your resume to start applying for jobs and unlock
                personalized recommendations.
              </p>
            </div>
            <Link href="/candidate/practice">
              <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors">
                Upload Resume
              </button>
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Briefcase}
            label="Applications"
            value={applications.length}
            color="text-blue-500"
          />
          <StatCard
            icon={BrainCircuit}
            label="Practice Sessions"
            value={practiceInterviews.length}
            color="text-purple-500"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Practice Score"
            value={practiceInterviews.length > 0 ? `${avgScore}%` : "N/A"}
            color="text-green-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Applications & Practice */}
          <div className="lg:col-span-1 space-y-6">
            {/* Practice Card */}
            <PracticeCard />

            {/* Recent Applications */}
            {applications.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>My Applications</span>
                  </h3>
                  {applications.length > 3 && (
                    <Link
                      href="/candidate/applications"
                      className="text-xs text-chart-2 hover:underline"
                    >
                      View All
                    </Link>
                  )}
                </div>

                <div className="space-y-3">
                  {applications.slice(0, 3).map((app) => (
                    <ApplicationCard key={app.id} application={app} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Job Listings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-primary flex items-center space-x-2">
                <Users className="h-6 w-6" />
                <span>Available Positions ({activeJobs.length})</span>
              </h2>
            </div>

            {activeJobs.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {activeJobs.map((job) => (
                  <JobListingCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="text-center p-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-card/50">
                <Briefcase className="h-10 w-10 mx-auto text-primary/50 mb-3" />
                <p className="text-lg font-medium">
                  No active job postings right now.
                </p>
                <p className="text-sm mt-1">
                  Check back later or start a practice session!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
