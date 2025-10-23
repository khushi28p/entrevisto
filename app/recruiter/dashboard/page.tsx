import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { Briefcase, Building, ListChecks, Users, Plus} from 'lucide-react';
import Link from 'next/link';

// Helper function to format currency or numbers
const formatMetric = (value: number) => {
  if (value > 999) return `${(value / 1000).toFixed(1)}k`;
  return value.toString();
};

// Component for a simple metric display card
const MetricCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string, icon: React.ElementType, colorClass: string }) => (
  <div className="flex items-center justify-between p-6 bg-card border border-border rounded-xl shadow-lg transition-shadow hover:shadow-xl">
    <div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <h3 className="text-3xl font-serif font-bold text-foreground mt-1">{value}</h3>
    </div>
    <div className={`p-3 rounded-md ${colorClass} text-primary-foreground`}>
      <Icon className="h-6 w-6" />
    </div>
  </div>
);

// Component for a Job Posting status card
const JobPostingCard = ({ job }: { 
  job: { 
    id: string; 
    title: string; 
    isActive: boolean; 
    _count: { applications: number }; 
    createdAt: Date 
  } 
}) => (
  <Link 
    href={`/recruiter/jobs/${job.id}`} 
    className="block p-6 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/50"
  >
    <h4 className="text-xl font-serif font-semibold text-foreground truncate">{job.title}</h4>
    <div className="flex justify-between items-center mt-3 text-sm text-muted-foreground">
      <span className="flex items-center space-x-1">
        <Users className="h-4 w-4" />
        <span>{job._count.applications} Applicants</span>
      </span>
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${job.isActive ? 'bg-chart-1/10 text-chart-1' : 'bg-secondary/10 text-secondary-foreground'}`}>
        {job.isActive ? 'Active' : 'Inactive'}
      </span>
    </div>
    <p className="text-xs text-muted-foreground mt-2">Posted: {job.createdAt.toLocaleDateString()}</p>
  </Link>
);


export default async function RecruiterDashboardPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    // Should not happen if middleware is set up correctly, but handle gracefully
    redirect('/sign-in');
  }

  // Fetch the full user profile including relationships
  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      recruiterProfile: {
        include: {
          company: {
            include: {
              jobPostings: {
                select: {
                  id: true,
                  title: true,
                  isActive: true,
                  createdAt: true,
                  _count: { select: { applications: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  // 1. Role Enforcement Check
  if (!user || user.role !== Role.RECRUITER) {
    // If the user is not a recruiter, send them to their expected dashboard or role selection
    redirect(user ? '/candidate/dashboard' : '/select-role'); 
  }
  
  const recruiterProfile = user.recruiterProfile;
  
  // 2. Onboarding Completion Check
  if (!recruiterProfile || !recruiterProfile.company) {
    // If the user is a recruiter but hasn't completed onboarding, redirect them
    redirect('/recruiter/onboarding');
  }

  const company = recruiterProfile.company;
  const jobPostings = company.jobPostings || [];
  
  const totalApplications = jobPostings.reduce((sum, job) => sum + job._count.applications, 0);
  const activeJobs = jobPostings.filter(job => job.isActive).length;
  
  const metricsData = [
    { title: "Total Job Postings", value: formatMetric(jobPostings.length), icon: Briefcase, colorClass: 'bg-chart-1' },
    { title: "Active Applications", value: formatMetric(totalApplications), icon: Users, colorClass: 'bg-chart-2' },
    { title: "Currently Open Jobs", value: formatMetric(activeJobs), icon: ListChecks, colorClass: 'bg-chart-3' },
  ];

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header and Welcome */}
        <header className="pt-8">
          <h1 className="text-4xl font-serif font-extrabold tracking-tight text-foreground">
            Welcome back, {user.email}!
          </h1>
          <div className="flex items-center text-muted-foreground mt-1 space-x-2">
             <Building className="h-5 w-5" />
             <p className="text-lg font-medium">{company.name} Dashboard</p>
          </div>
        </header>
        
        {/* Metric Cards Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metricsData.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </section>
        
        {/* Job Postings Management */}
        <section className="bg-card border border-border rounded-xl p-6 shadow-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-border/80 pb-4">
            <h2 className="text-2xl font-serif font-bold text-secondary-foreground">
              Your Job Postings ({jobPostings.length})
            </h2>
            <Link href="/recruiter/jobs/new">
              <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-md hover:bg-primary/90 transition-colors">
                <Plus className="h-5 w-5" />
                <span className="font-medium">New Job</span>
              </button>
            </Link>
          </div>
          
          {jobPostings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobPostings.map((job) => (
                <JobPostingCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center p-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
              <Briefcase className="h-10 w-10 mx-auto text-primary/50 mb-3" />
              <p className="text-lg font-medium">No job postings found for {company.name}.</p>
              <p className="text-sm mt-1">Click New Job to start screening candidates with AI.</p>
            </div>
          )}
        </section>
        
      </div>
    </div>
  );
}
