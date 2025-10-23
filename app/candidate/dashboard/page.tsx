import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { Briefcase, BrainCircuit, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Component for a simple Job Listing card
const JobListingCard = ({ job }: { 
  job: { 
    id: string; 
    title: string; 
    company: { name: string }; 
    description: string;
    requirements: string; 
  } 
}) => {
    // Show top 3 requirements for preview
    const requirementsList = job.requirements.split(',').slice(0, 3).map(r => r.trim());

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
            <h5 className="text-xs font-semibold uppercase text-primary mb-2">Key Skills</h5>
            <div className="flex flex-wrap gap-2">
                {requirementsList.map((req, index) => (
                    <span key={index} className="px-3 py-1 text-xs font-medium bg-chart-2/10 text-chart-2 rounded-full">
                        {req}
                    </span>
                ))}
                {requirementsList.length === 3 && (
                   <span className="px-3 py-1 text-xs font-medium bg-chart-2/10 text-chart-2 rounded-full">...</span>
                )}
            </div>
        </div>

      </Link>
    );
};

// Component for the Practice Interview Call-to-Action
const PracticeCard = () => (
    <div className="col-span-full md:col-span-1 p-8 bg-card border-2 border-dashed border-chart-2/50 rounded-xl shadow-lg flex flex-col items-center justify-center text-center">
        <BrainCircuit className="h-12 w-12 text-chart-2 mb-4" />
        <h3 className="text-2xl font-serif font-bold text-secondary-foreground">
            AI Interview Practice
        </h3>
        <p className="text-muted-foreground mt-2 mb-6">
            Upload your latest resume and practice with our Vapi AI Agent. Get instant, confidential feedback.
        </p>
        <Link href="/candidate/practice">
            <button className="flex items-center space-x-2 px-6 py-3 bg-chart-2 text-primary-foreground rounded-full shadow-md hover:bg-chart-2/90 transition-colors font-semibold">
                <BrainCircuit className="h-5 w-5" />
                <span>Start Practice Session</span>
            </button>
        </Link>
    </div>
);


export default async function CandidateDashboardPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect('/sign-in');
  }

  // Fetch user and all active job postings
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { 
        role: true, 
        email: true,
        candidateProfile: { select: { id: true, resumeText: true } }
    },
  });

  // Role Enforcement Check: Ensure only CANDIDATEs access this page
  if (!user || user.role !== Role.CANDIDATE) {
    // If not a candidate (or not yet assigned a role), redirect to role selection
    redirect(user ? '/recruiter/dashboard' : '/select-role'); 
  }

  // Fetch active job postings from the database
  const activeJobs = await prisma.jobPosting.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      description: true,
      requirements: true,
      company: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  // const hasResume = !!user.candidateProfile?.resumeText;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header and Welcome */}
        <header className="pt-8 border-b border-border/80 pb-6">
          <h1 className="text-4xl font-serif font-extrabold tracking-tight text-foreground">
            Hello, {user.email}!
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Your career gateway to AI-driven interview opportunities.
          </p>
        </header>
        
        {/* Main Sections: Practice CTA & Job Listings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Practice Card (Fixed column for visibility) */}
            <PracticeCard />

            {/* Job Listings Section */}
            <section className="md:col-span-2 space-y-6">
                <h2 className="text-2xl font-serif font-bold text-primary flex items-center space-x-2">
                    <Users className="h-6 w-6" />
                    <span>Available Job Openings ({activeJobs.length})</span>
                </h2>

                {activeJobs.length > 0 ? (
                    <div className="space-y-4">
                        {activeJobs.map((job) => (
                            <JobListingCard key={job.id} job={job} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-card/50">
                        <Briefcase className="h-10 w-10 mx-auto text-primary/50 mb-3" />
                        <p className="text-lg font-medium">No active job postings right now.</p>
                        <p className="text-sm mt-1">Check back later or start a practice session to hone your skills!</p>
                    </div>
                )}
            </section>
        </div>
        
      </div>
    </div>
  );
}
