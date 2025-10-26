'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Loader2, Upload, BrainCircuit, CheckCircle, XCircle, Briefcase, Factory } from 'lucide-react';

// --- Utility Components (ThemeButton is assumed to be defined) ---

const ThemeButton = ({ children, onClick, disabled, loading, className = '' }: { 
    children: React.ReactNode, 
    onClick: () => void, 
    disabled?: boolean, 
    loading?: boolean, 
    className?: string 
}) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className={`w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-md 
                font-sans font-semibold text-lg tracking-wide 
                bg-chart-2 text-primary-foreground hover:bg-chart-2/90 
                transition-opacity duration-300 shadow-md
                ${(disabled || loading) ? 'opacity-60 cursor-not-allowed' : ''}
                ${className}`}
  >
    {loading && <Loader2 className="h-5 w-5 animate-spin" />}
    <span>{children}</span>
  </button>
);


// --- Job Data Type (Assuming server structure) ---
interface JobDetails {
    id: string;
    title: string;
    description: string;
    requirements: string;
    companyName: string;
    applicationsCount: number;
    hasExistingApplication: boolean;
    hasResumeText: boolean;
    existingApplicationId: string | null;
}

// --- Main Application Page Component ---

export default function CandidateApplyPage({ params }: { params: { jobId: string } }) {
    const router = useRouter();
    const { isLoaded: isAuthLoaded } = useAuth();
    const jobId = params.jobId;

    const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [isInterviewLoading, setIsInterviewLoading] = useState(false);
    const [interviewError, setInterviewError] = useState<string | null>(null);
    
    // Resume status based on initial server fetch
    const hasParsedResumeText = useMemo(() => jobDetails?.hasResumeText || false, [jobDetails]);
    const hasExistingApplication = useMemo(() => jobDetails?.hasExistingApplication || false, [jobDetails]);

    // 1. Initial Data Fetch
    useEffect(() => {
        if (!isAuthLoaded) return;

        const fetchJobData = async () => {
            try {
                // Fetch job details and candidate's current status (resume, existing app)
                const response = await fetch(`/api/candidate/job-details/${jobId}`); 
                if (!response.ok) throw new Error("Failed to fetch job details.");
                
                const data: JobDetails = await response.json();
                setJobDetails(data);

            } catch (e) {
                console.error("Job data fetch error:", e);
                router.push('/candidate/dashboard'); // Redirect on failure
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchJobData();
    }, [isAuthLoaded, jobId, router]);


    // 2. Resume Upload Handler (Existing logic repurposed)
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null);
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
          setResumeFile(file);
        } else {
          setResumeFile(null);
          setUploadError('Please select a valid PDF file.');
        }
    }, []);

    const handleUploadSubmit = async () => {
        if (!resumeFile) {
          setUploadError('No resume file selected.');
          return;
        }

        setIsUploading(true);
        setUploadError(null);

        const formData = new FormData();
        formData.append('resume', resumeFile);

        try {
            // Call the existing resume upload API
            const response = await fetch('/api/candidate/resume-upload', { method: 'POST', body: formData });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to process resume.' }));
                setUploadError(errorData.message || response.statusText);
            } else {
                // Update local state to show resume is ready
                setJobDetails(prev => prev ? ({ ...prev, hasResumeText: true }) : null);
            }
        } catch (e) {
            console.error('Resume upload network error:', e);
            setUploadError('A network error occurred during upload.');
        } finally {
            setIsUploading(false);
        }
    };


    // 3. Application/Interview Launch Handler
    const handleLaunchInterview = async () => {
        if (!hasParsedResumeText) {
            setInterviewError('Resume must be analyzed before starting the application interview.');
            return;
        }

        setIsInterviewLoading(true);
        setInterviewError(null);

        try {
            // Call the Vapi launch endpoint, passing the jobId for application tracking
            const response = await fetch('/api/candidate/application-launch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: jobId, sessionType: 'APPLICATION' }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to start AI interview.' }));
                setInterviewError(errorData.message || response.statusText);
            } else {
                const data = await response.json();
                // Redirect to the live interview page, using the Prisma DB ID
                router.push(`/candidate/interview/${data.interviewResultId}`);
            }

        } catch (e) {
            console.error('Application launch network error:', e);
            setInterviewError('Could not connect to the interview service.');
        } finally {
            setIsInterviewLoading(false);
        }
    };

    if (isLoadingData || !isAuthLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!jobDetails) return null; // Should be handled by redirect above

    const isUploadDisabled = isUploading || resumeFile === null;
    const isLaunchDisabled = isInterviewLoading || !hasParsedResumeText || hasExistingApplication;

    return (
        <div className="min-h-screen bg-background p-4 sm:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-10 pt-8">
                
                {/* Job Header */}
                <header className="border-b border-border/80 pb-6 space-y-2">
                    <div className="flex items-center justify-between">
                        <h1 className="text-4xl font-serif font-extrabold tracking-tight text-foreground">
                            {jobDetails.title}
                        </h1>
                        <div className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                            <Factory className="h-4 w-4" />
                            <span>{jobDetails.companyName}</span>
                        </div>
                    </div>
                    <p className="text-muted-foreground max-w-4xl text-lg">
                        Applications: {jobDetails.applicationsCount}
                    </p>
                </header>

                {/* Application Steps */}
                <div className="grid md:grid-cols-3 gap-8">
                    
                    {/* Job Details Panel */}
                    <div className="md:col-span-2 p-8 bg-card border border-border rounded-xl shadow-lg space-y-6">
                        <h2 className="text-2xl font-serif font-bold text-primary">Job Description</h2>
                        <div className="text-secondary-foreground text-sm leading-relaxed whitespace-pre-wrap">
                            {jobDetails.description}
                        </div>
                        <h3 className="text-xl font-serif font-bold text-secondary-foreground pt-4 flex items-center space-x-2">
                             <Briefcase className="h-5 w-5"/> <span>Core Requirements</span>
                        </h3>
                        <p className="text-muted-foreground text-sm">{jobDetails.requirements}</p>
                    </div>

                    {/* Application Controls (Sidebar) */}
                    <div className="md:col-span-1 space-y-8">
                        
                        {/* Status Panel */}
                        <div className="p-6 bg-card border border-border rounded-xl shadow-lg space-y-4">
                            <h3 className="text-xl font-serif font-bold text-secondary-foreground">Your Status</h3>
                            
                            <div className="flex items-center space-x-3">
                                {hasParsedResumeText ? <CheckCircle className="h-5 w-5 text-chart-1" /> : <XCircle className="h-5 w-5 text-destructive" />}
                                <span className="text-sm text-foreground">Resume Analyzed</span>
                            </div>

                            <div className="flex items-center space-x-3">
                                {hasExistingApplication ? <CheckCircle className="h-5 w-5 text-chart-4" /> : <XCircle className="h-5 w-5 text-muted-foreground" />}
                                <span className="text-sm text-foreground">Application Started</span>
                            </div>

                            {hasExistingApplication && (
                                <div className="p-3 bg-secondary/20 rounded-md text-sm text-secondary-foreground">
                                    You have already submitted an application ({jobDetails.existingApplicationId?.slice(-8)}). Please check your dashboard.
                                </div>
                            )}
                        </div>

                        {/* Resume Upload Box */}
                        <div className="p-6 bg-card border border-border rounded-xl shadow-lg space-y-4">
                            <h3 className="text-xl font-serif font-bold text-secondary-foreground">1. Upload Resume</h3>
                            <input
                                id="resume-upload"
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                disabled={isUploading}
                                className="block w-full text-sm text-foreground/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
                            />
                            <ThemeButton 
                                onClick={handleUploadSubmit} 
                                loading={isUploading}
                                disabled={isUploadDisabled}
                                className="bg-chart-2 hover:bg-chart-2/80"
                            >
                                <Upload className="h-5 w-5" />
                                <span>{isUploading ? 'Processing...' : 'Analyze Resume'}</span>
                            </ThemeButton>
                            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
                        </div>


                        {/* Launch Interview Box */}
                        <div className="p-6 bg-card border border-border rounded-xl shadow-lg space-y-4">
                            <h3 className="text-xl font-serif font-bold text-secondary-foreground">2. Start Interview</h3>
                            <p className="text-sm text-muted-foreground">
                                This is your required AI screening interview based on the job requirements.
                            </p>
                            <ThemeButton 
                                onClick={handleLaunchInterview} 
                                loading={isInterviewLoading}
                                disabled={isLaunchDisabled}
                                className="bg-chart-3 hover:bg-chart-3/90"
                            >
                                <BrainCircuit className="h-5 w-5" />
                                <span>{isInterviewLoading ? 'Launching...' : 'Submit Application & Start'}</span>
                            </ThemeButton>
                            {interviewError && <p className="text-xs text-destructive">{interviewError}</p>}
                        </div>

                    </div>
                </div>
                
            </div>
        </div>
    );
}
