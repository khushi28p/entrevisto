import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Role, ApplicationStatus } from '@prisma/client';
import { Briefcase, Factory, UserCheck, Search, Zap, Clock,} from 'lucide-react';
import Link from 'next/link';

// Helper function to get a color class based on the application status
const getStatusClasses = (status: ApplicationStatus) => {
  switch (status) {
    case ApplicationStatus.APPLIED:
    case ApplicationStatus.INTERVIEW_SCHEDULED:
      return 'bg-secondary/20 text-secondary-foreground border-secondary'; // Waiting for Screening
    case ApplicationStatus.AI_SCREENING_COMPLETE:
    case ApplicationStatus.REVIEWED_BY_RECRUITER:
      return 'bg-chart-4/20 text-chart-4 border-chart-4'; // Ready for Review/In Review
    case ApplicationStatus.OFFERED:
      return 'bg-chart-1/20 text-chart-1 border-chart-1'; // Positive Outcome
    case ApplicationStatus.REJECTED:
      return 'bg-destructive/20 text-destructive border-destructive'; // Negative Outcome
    default:
      return 'bg-muted/50 text-muted-foreground border-muted';
  }
};

// Component to render the AI Score and Status
const ScoreBadge = ({ score }: { score: number | null }) => {
    if (score === null || score === 0) {
        return (
            <div className="flex items-center space-x-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Pending AI Screen</span>
            </div>
        );
    }
    
    const color = score >= 8 ? 'text-chart-1' : score >= 5 ? 'text-chart-4' : 'text-destructive';
    
    return (
        <div className="flex items-center space-x-1">
            <Zap className={`h-4 w-4 ${color}`} />
            <span className={`text-base font-bold ${color}`}>Score: {score.toFixed(1)}/10</span>
        </div>
    );
};

// Component to render a single Application row
const ApplicationRow = ({ app }: { 
    app: { 
        id: string; 
        status: ApplicationStatus; 
        appliedAt: Date; 
        jobPosting: { title: string; id: string }; 
        candidate: { user: { email: string; firstName: string | null; lastName: string | null; } }; 
        interviewResult: { score: number | null; id: string } | null;
    },
    userEmail: string
}) => {
    const candidateName = `${app.candidate.user.firstName || ''} ${app.candidate.user.lastName || ''}`.trim() || app.candidate.user.email;
    const statusText = app.status.replace(/_/g, ' ');

    return (
        <Link 
            href={`/recruiter/application/${app.id}`} 
            className="grid grid-cols-12 items-center border-b border-border/70 p-4 hover:bg-card/70 transition-colors"
        >
            {/* Candidate Info */}
            <div className="col-span-4 flex items-center space-x-3 truncate">
                <UserCheck className="h-5 w-5 text-chart-2" />
                <span className="font-medium text-foreground truncate">{candidateName}</span>
            </div>
            
            {/* Job Title */}
            <div className="col-span-3 text-sm text-muted-foreground truncate">
                {app.jobPosting.title}
            </div>
            
            {/* AI Score */}
            <div className="col-span-2">
                <ScoreBadge score={app.interviewResult?.score ?? null} />
            </div>

            {/* Status Badge */}
            <div className="col-span-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize border ${getStatusClasses(app.status)}`}>
                    {statusText}
                </span>
            </div>

            {/* Action Icon */}
            <div className="col-span-1 flex justify-end">
                <Search className="h-5 w-5 text-primary hover:scale-110 transition-transform" />
            </div>
        </Link>
    );
};


export default async function RecruiterApplicationsPage() {
    const { userId: clerkId } = auth();

    if (!clerkId) {
        redirect('/sign-in');
    }

    // 1. Fetch Recruiter Profile and associated Company/Applications
    const recruiterData = await prisma.user.findUnique({
        where: { clerkId },
        select: {
            role: true,
            email: true,
            recruiterProfile: {
                select: {
                    company: {
                        select: {
                            name: true,
                            id: true,
                            jobPostings: {
                                select: { id: true }
                            }
                        }
                    }
                }
            }
        },
    });

    // Role and Onboarding Check
    if (!recruiterData || recruiterData.role !== Role.RECRUITER) {
        redirect('/select-role'); 
    }
    
    const companyId = recruiterData.recruiterProfile?.company?.id;
    if (!companyId) {
        // If they are a recruiter but not onboarded
        redirect('/recruiter/onboarding');
    }

    // 2. Fetch all Applications for all job postings within this company
    const applications = await prisma.application.findMany({
        where: {
            jobPosting: {
                companyId: companyId
            }
        },
        select: {
            id: true,
            status: true,
            appliedAt: true,
            jobPosting: { select: { title: true, id: true } },
            candidate: { 
                select: { 
                    user: { 
                        select: { email: true, firstName: true, lastName: true } 
                    } 
                } 
            },
            interviewResult: { select: { score: true, id: true } },
        },
        orderBy: { appliedAt: 'desc' },
    });
    
    const applicationsAwaitingReview = applications.filter(app => 
        app.status === ApplicationStatus.AI_SCREENING_COMPLETE
    ).length;

    return (
        <div className="min-h-screen bg-background p-4 sm:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-10">
                
                {/* Header */}
                <header className="pt-8 border-b border-border/80 pb-6">
                    <div className="flex items-center space-x-3">
                        <Factory className="h-8 w-8 text-primary" />
                        <h1 className="text-4xl font-serif font-extrabold tracking-tight text-foreground">
                            {recruiterData.recruiterProfile?.company?.name || 'Recruiter'} Applications
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground mt-2">
                        Overview of all {applications.length} candidates. **{applicationsAwaitingReview}** applications are ready for final review.
                    </p>
                </header>
                
                {/* Applications Table Header */}
                <div className="bg-secondary/50 rounded-t-xl p-4 shadow-sm font-semibold text-xs uppercase tracking-wider text-secondary-foreground">
                    <div className="grid grid-cols-12 items-center">
                        <div className="col-span-4">Candidate</div>
                        <div className="col-span-3">Job Title</div>
                        <div className="col-span-2">AI Score</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-right">View</div>
                    </div>
                </div>

                {/* Applications List */}
                <div className="bg-card border border-border rounded-b-xl shadow-2xl divide-y divide-border/70">
                    {applications.length > 0 ? (
                        applications.map((app) => (
                            <ApplicationRow key={app.id} app={app} userEmail={recruiterData.email} />
                        ))
                    ) : (
                        <div className="text-center p-12 text-muted-foreground">
                            <Briefcase className="h-10 w-10 mx-auto text-primary/50 mb-3" />
                            <p className="text-lg font-medium">No applications received yet.</p>
                        </div>
                    )}
                </div>
                
            </div>
        </div>
    );
}
