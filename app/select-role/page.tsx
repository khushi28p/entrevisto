'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import React, { useState } from 'react';
import { Loader2, User, Briefcase, ChevronRight } from 'lucide-react';

// --- Utility Components based on Theme ---

interface RoleOptionProps {
  role: 'CANDIDATE' | 'RECRUITER';
  title: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
  onClick: (role: 'CANDIDATE' | 'RECRUITER') => void;
  isLoading: boolean;
  features: string[];
}

const RoleOption: React.FC<RoleOptionProps> = ({ 
  role, 
  title, 
  description, 
  icon: Icon, 
  colorClass,
  onClick,
  isLoading,
  features
}) => (
  <div 
    className={`
      flex flex-col p-6 sm:p-8 border border-border rounded-lg h-full
      transition-all duration-300 cursor-pointer 
      hover:border-ring hover:shadow-md
      group
    `}
    onClick={() => !isLoading && onClick(role)}
  >
    <div className="flex items-center space-x-4 mb-4">
      <div className={`p-3 rounded-md ${colorClass} text-primary-foreground shadow-sm transition-transform group-hover:scale-105`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-2xl font-serif font-bold text-foreground">{title}</h3>
    </div>
    
    <p className="text-muted-foreground flex-grow mb-6">{description}</p>

    <div className="mb-6 space-y-2">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center text-sm text-secondary-foreground">
            <ChevronRight className="h-4 w-4 mr-1 text-primary" />
            {feature}
          </div>
        ))}
    </div>

    <button
      onClick={(e) => { e.stopPropagation(); onClick(role); }}
      disabled={isLoading}
      className={`
        mt-auto w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-md 
        font-sans font-semibold text-base tracking-wide 
        transition-all duration-300
        ${colorClass === 'bg-chart-2' 
          ? 'bg-chart-2 text-primary-foreground hover:bg-chart-2/80' 
          : 'bg-chart-1 text-primary-foreground hover:bg-chart-1/80'
        }
        ${isLoading ? 'opacity-60 cursor-not-allowed' : 'shadow-sm hover:shadow-md'}
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Setting Role...</span>
        </>
      ) : (
        <span>I am a {title}</span>
      )}
    </button>
  </div>
);


// --- Main Page Component ---

export default function SelectRolePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [loadingRole, setLoadingRole] = useState<'CANDIDATE' | 'RECRUITER' | null>(null);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  const handleRoleSelect = async (role: 'CANDIDATE' | 'RECRUITER') => {
    if (!user || loadingRole) return;

    setLoadingRole(role);

    try {
      // 1. Call the actual API endpoint
      const response = await fetch('/api/user/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      console.log("response: ", response);
      if (!response.ok) {
        // Handle API errors (e.g., 400 Bad Request, 500 Internal Error)
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', errorData.message || response.statusText);
        setLoadingRole(null);
        // NOTE: In a real app, you would show a user-facing error message here.
        return;
      }

      // 2. Redirect based on role after successful database update
      if (role === 'RECRUITER') {
        router.push('/recruiter/onboarding');
      } else {
        router.push('/candidate/dashboard');
      }
    } catch (error) {
      console.error('Network or unexpected error setting role:', error);
      setLoadingRole(null);
      // NOTE: Show generic network error to user.
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-8 bg-background text-foreground font-sans">
      
      {/* --- Main Selection Card (The enclosing element) --- */}
      <div className="w-full max-w-5xl bg-card text-card-foreground border border-border shadow-2xl rounded-xl p-8 md:p-12">
        
        {/* Header Section */}
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-serif font-extrabold tracking-tight text-primary">
            Select Your Role
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started by defining how you&apos;ll use the AI Screening Platform.
          </p>
        </header>

        {/* Role Options Container */}
        <div className="grid gap-8 md:grid-cols-2">

          <RoleOption
            role="CANDIDATE"
            title="Candidate"
            description="Access practice tools, take AI-powered interviews, and submit your applications for job postings."
            features={[
              "AI Interview Practice",
              "Resume-based Q&A",
              "Detailed Performance Scoring"
            ]}
            icon={User}
            colorClass="bg-chart-2" 
            onClick={handleRoleSelect}
            isLoading={loadingRole === 'CANDIDATE'}
          />

          <RoleOption
            role="RECRUITER"
            title="Recruiter"
            description="Post jobs, manage applications, and review AI-generated candidate interview reports."
            features={[
              "Manage Job Postings",
              "View AI Interview Transcripts",
              "Filter Candidates by Score"
            ]}
            icon={Briefcase}
            colorClass="bg-chart-1"
            onClick={handleRoleSelect}
            isLoading={loadingRole === 'RECRUITER'}
          />

        </div>
      </div>
    </div>
  );
}
