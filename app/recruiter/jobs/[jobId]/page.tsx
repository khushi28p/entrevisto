import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Calendar,
  Users,
  Edit,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

type PageProps = {
  params: Promise<{ jobId: string }>;
};

// Application Card Component
const ApplicationCard = ({
  application,
}: {
  application: {
    id: string;
    status: string;
    appliedAt: Date;
    candidate: {
      user: {
        email: string;
      };
    };
    interviewResult: {
      score: number;
    } | null;
  };
}) => {
  const statusColors = {
    APPLIED: "bg-blue-500/10 text-blue-500",
    AI_SCREENING_COMPLETE: "bg-green-500/10 text-green-500",
    REVIEWED_BY_RECRUITER: "bg-orange-500/10 text-orange-500",
    OFFERED: "bg-emerald-500/10 text-emerald-500",
    REJECTED: "bg-red-500/10 text-red-500",
  };

  const statusLabels = {
    APPLIED: "Applied",
    AI_SCREENING_COMPLETE: "Screening Complete",
    REVIEWED_BY_RECRUITER: "Under Review",
    OFFERED: "Offered",
    REJECTED: "Rejected",
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <Link
      href={`/recruiter/applications/${application.id}`}
      className="block p-4 bg-card border border-border rounded-lg hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-foreground">
            {application.candidate.user.email}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Applied: {new Date(application.appliedAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            statusColors[application.status as keyof typeof statusColors]
          }`}
        >
          {statusLabels[application.status as keyof typeof statusLabels]}
        </span>
      </div>

      {application.interviewResult && (
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">Interview Score</span>
          <span
            className={`text-sm font-bold ${getScoreColor(
              application.interviewResult.score
            )}`}
          >
            {application.interviewResult.score}/100
          </span>
        </div>
      )}
    </Link>
  );
};

export default async function JobDetailsPage({ params }: PageProps) {
  const { jobId } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      role: true,
      recruiterProfile: {
        select: { companyId: true },
      },
    },
  });

  if (!user || user.role !== "RECRUITER") {
    redirect("/candidate/dashboard");
  }

  // Fetch job with applications
  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    include: {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      applications: {
        include: {
          candidate: {
            select: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
          interviewResult: {
            select: {
              score: true,
            },
          },
        },
        orderBy: { appliedAt: "desc" },
      },
    },
  });

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Job Not Found</h1>
          <p className="text-muted-foreground">
            The job posting you&apos;re looking for doesn&apos;t exist.
          </p>
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

  // Verify ownership
  if (job.company.id !== user.recruiterProfile?.companyId) {
    redirect("/recruiter/dashboard");
  }

  // Calculate statistics
  const totalApplications = job.applications.length;
  const completedScreenings = job.applications.filter(
    (app) =>
      app.status === "AI_SCREENING_COMPLETE" ||
      app.status === "REVIEWED_BY_RECRUITER" ||
      app.status === "OFFERED" ||
      app.status === "REJECTED"
  ).length;
  const averageScore =
    job.applications
      .filter((app) => app.interviewResult)
      .reduce((sum, app) => sum + (app.interviewResult?.score || 0), 0) /
    (job.applications.filter((app) => app.interviewResult).length || 1);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <Link
            href="/recruiter/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Dashboard
          </Link>

          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground">
                {job.title}
              </h1>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{job.company.name}</span>
                <span>•</span>
                <Calendar className="h-4 w-4" />
                <span>
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  job.isActive
                    ? "bg-green-500/10 text-green-500"
                    : "bg-gray-500/10 text-gray-500"
                }`}
              >
                {job.isActive ? "Active" : "Inactive"}
              </span>
              <Link
                href={`/recruiter/jobs/${jobId}/edit`}
                className="flex items-center space-x-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">
                Total Applications
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {totalApplications}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Screened</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {completedScreenings}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Avg Score</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {totalApplications > 0 ? Math.round(averageScore) : "N/A"}
            </p>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Job Description</span>
              </h2>
              <div className="text-sm text-secondary-foreground whitespace-pre-wrap leading-relaxed">
                {job.description}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Requirements
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.requirements.split(",").map((req, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
                  >
                    {req.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Applications Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-8">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Applications ({totalApplications})</span>
              </h2>

              {job.applications.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {job.applications.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No applications yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
