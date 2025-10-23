'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Loader2, Upload, FileText, BrainCircuit, CheckCircle, XCircle } from 'lucide-react';

// --- Utility Components ---

// Reusable Button component
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

// --- API Endpoints ---

// NOTE: We need a new endpoint to handle file uploads and PDF parsing.
// We will assume the endpoint is: /api/candidate/resume-upload
// And Vapi launch is: /api/candidate/vapi-practice-session

// --- Main Component ---

export default function CandidatePracticePage() {
  const router = useRouter();
  const { isLoaded } = useAuth();
  
  // State for the uploaded file and status
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false); // Simulate status from DB/Context

  // State for Vapi Interview
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);

  // Simulated status: In a real app, this would be fetched from the database 
  // via a server component or a client-side query.
  const hasParsedResumeText = useMemo(() => {
    // For demonstration, assume success means text is ready
    return uploadSuccess; 
  }, [uploadSuccess]);


  // Handler for file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(false);
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
    } else {
      setResumeFile(null);
      setUploadError('Please select a valid PDF file.');
    }
  }, []);

  // Handler for resume upload submission
  const handleUploadSubmit = async () => {
    if (!resumeFile) {
      setUploadError('No resume file selected.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    // 1. Prepare FormData for file upload
    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      // 2. Call the resume upload API endpoint
      const response = await fetch('/api/candidate/resume-upload', {
        method: 'POST',
        body: formData,
        // NOTE: Do NOT set Content-Type header when uploading FormData, 
        // the browser sets it automatically with the correct boundary.
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to process resume.' }));
        setUploadError(errorData.message || response.statusText);
        setUploadSuccess(false);
      } else {
        // Success: Resume text is now saved in CandidateProfile.resumeText
        setUploadSuccess(true);
      }
    } catch (e) {
      console.error('Resume upload network error:', e);
      setUploadError('A network error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handler for launching the Vapi Practice Session
  const handleStartPractice = async () => {
    if (!hasParsedResumeText) {
        setInterviewError('Please upload and process your resume before starting the interview.');
        return;
    }
    
    setIsInterviewLoading(true);
    setInterviewError(null);

    try {
        // 1. Call the Vapi session launch endpoint
        const response = await fetch('/api/candidate/vapi-practice-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionType: 'PRACTICE' }), // Indicate practice session
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to start AI interview.' }));
            setInterviewError(errorData.message || response.statusText);
        } else {
            const data = await response.json();
            // 2. Redirect the user to the live interview page, passing the Vapi Call ID
            router.push(`/candidate/interview/${data.sessionId}`);
        }

    } catch (e) {
        console.error('Vapi session network error:', e);
        setInterviewError('Could not connect to the interview service.');
    } finally {
        setIsInterviewLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isUploadDisabled = isUploading || !resumeFile;
  const isPracticeDisabled = isInterviewLoading || !hasParsedResumeText;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 font-sans">
        <div className="max-w-4xl mx-auto space-y-10 pt-8">
            
            {/* Header */}
            <header className="text-center border-b border-border/80 pb-6">
                <BrainCircuit className="h-12 w-12 text-primary mx-auto mb-3" />
                <h1 className="text-4xl font-serif font-extrabold tracking-tight text-primary">
                    AI Interview Practice Mode
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                    Start a personalized mock interview based on your career history.
                </p>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                
                {/* 1. Resume Upload Card */}
                <div className="p-8 bg-card border border-border rounded-xl shadow-lg space-y-6">
                    <h2 className="text-2xl font-serif font-bold text-secondary-foreground flex items-center space-x-2">
                        <FileText className="h-6 w-6 text-chart-2" />
                        <span>Step 1: Upload Resume (PDF)</span>
                    </h2>
                    
                    <div className="space-y-4">
                        <label htmlFor="resume-upload" className="block text-sm font-medium text-foreground">
                            Select PDF File
                        </label>
                        <div className="flex items-center space-x-3">
                            <input
                                id="resume-upload"
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                disabled={isUploading}
                                className="block w-full text-sm text-foreground/80
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-secondary file:text-secondary-foreground
                                    hover:file:bg-secondary/80
                                "
                            />
                        </div>
                    </div>
                    
                    {resumeFile && (
                        <p className="text-sm text-muted-foreground flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>Selected: **{resumeFile.name}** ({Math.round(resumeFile.size / 1024)} KB)</span>
                        </p>
                    )}

                    <ThemeButton 
                        onClick={handleUploadSubmit} 
                        loading={isUploading}
                        disabled={isUploadDisabled}
                        className="bg-chart-2 hover:bg-chart-2/80"
                    >
                        <Upload className="h-5 w-5" />
                        <span>{isUploading ? 'Processing...' : 'Upload & Analyze Resume'}</span>
                    </ThemeButton>

                    {uploadError && (
                        <div className="flex items-center space-x-2 text-sm text-destructive-foreground bg-destructive/10 border border-destructive p-3 rounded-md">
                            <XCircle className="h-4 w-4" />
                            <span>Upload Error: {uploadError}</span>
                        </div>
                    )}
                    {uploadSuccess && (
                        <div className="flex items-center space-x-2 text-sm text-chart-1 bg-chart-1/10 border border-chart-1 p-3 rounded-md">
                            <CheckCircle className="h-4 w-4" />
                            <span>Resume successfully processed and ready for interview!</span>
                        </div>
                    )}
                </div>

                {/* 2. Practice Start Card */}
                <div className="p-8 bg-card border border-border rounded-xl shadow-lg space-y-6 flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-secondary-foreground flex items-center space-x-2">
                            <BrainCircuit className="h-6 w-6 text-chart-3" />
                            <span>Step 2: Launch Interview</span>
                        </h2>
                        <p className="text-muted-foreground mt-4">
                            The Vapi AI Agent will ask you personalized questions based on the content of your analyzed resume.
                        </p>
                    </div>
                    
                    <div className={`p-4 rounded-lg text-sm font-medium ${hasParsedResumeText ? 'bg-chart-1/10 text-chart-1' : 'bg-destructive/10 text-destructive-foreground border border-destructive'}`}>
                        {hasParsedResumeText 
                            ? 'Status: Resume Analysis Complete. Ready to launch!' 
                            : 'Status: Resume analysis required. Please complete Step 1.'
                        }
                    </div>

                    {interviewError && (
                        <div className="flex items-center space-x-2 text-sm text-destructive-foreground bg-destructive/10 border border-destructive p-3 rounded-md">
                            <XCircle className="h-4 w-4" />
                            <span>Launch Error: {interviewError}</span>
                        </div>
                    )}

                    <ThemeButton 
                        onClick={handleStartPractice} 
                        loading={isInterviewLoading}
                        disabled={isPracticeDisabled}
                        className="bg-chart-3 hover:bg-chart-3/90"
                    >
                        <BrainCircuit className="h-5 w-5" />
                        <span>{isInterviewLoading ? 'Connecting to AI...' : 'Start Practice Session'}</span>
                    </ThemeButton>
                </div>

            </div>
        </div>
    </div>
  );
}
