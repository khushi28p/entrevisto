'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';
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
      flex flex-col p-6 sm:p-8 border border-gray-200 rounded-lg h-full
      transition-all duration-300 cursor-pointer 
      hover:border-blue-500 hover:shadow-md
      group
    `}
    onClick={() => !isLoading && onClick(role)}
  >
    <div className="flex items-center space-x-4 mb-4">
      <div className={`p-3 rounded-md ${colorClass} text-white shadow-sm transition-transform group-hover:scale-105`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
    </div>
    
    <p className="text-gray-600 flex-grow mb-6">{description}</p>

    <div className="mb-6 space-y-2">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center text-sm text-gray-700">
            <ChevronRight className="h-4 w-4 mr-1 text-blue-600" />
            {feature}
          </div>
        ))}
    </div>

    <button
      onClick={(e) => { e.stopPropagation(); onClick(role); }}
      disabled={isLoading}
      className={`
        mt-auto w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-md 
        font-semibold text-base tracking-wide 
        transition-all duration-300
        ${colorClass === 'bg-emerald-600' 
          ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
          : 'bg-blue-600 text-white hover:bg-blue-700'
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
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    // Check if user already has a role assigned
    const checkExistingRole = async () => {
      if (!isLoaded || !user) return;

      try {
        const response = await fetch("/api/user/get-role");
        
        if (response.ok) {
          const data = await response.json();
          
          // If user has a role, redirect them to appropriate dashboard
          if (data.role === 'RECRUITER') {
            router.push('/recruiter/dashboard');
          } else if (data.role === 'CANDIDATE') {
            router.push('/candidate/dashboard');
          } else {
            // User exists but no role set, stay on this page
            setCheckingRole(false);
          }
        } else if (response.status === 404) {
          // User not found in database, stay on this page
          setCheckingRole(false);
        } else {
          // Other error occurred
          console.error('Error checking role:', response.statusText);
          setCheckingRole(false);
        }
      } catch (error) {
        console.error('Network error checking role:', error);
        setCheckingRole(false);
      }
    };

    checkExistingRole();
  }, [isLoaded, user, router]);

  // Show loading while checking authentication and existing role
  if (!isLoaded || checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }
  
  const handleRoleSelect = async (role: 'CANDIDATE' | 'RECRUITER') => {
    if (!user || loadingRole) return;

    setLoadingRole(role);

    try {
      // Call the API endpoint to set user role
      const response = await fetch('/api/user/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        // Handle API errors
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', errorData.message || response.statusText);
        alert(`Error: ${errorData.message || 'Failed to set role. Please try again.'}`);
        setLoadingRole(null);
        return;
      }

      // Redirect based on role after successful database update
      if (role === 'RECRUITER') {
        router.push('/recruiter/onboarding');
      } else {
        router.push('/candidate/dashboard');
      }
    } catch (error) {
      console.error('Network or unexpected error setting role:', error);
      alert('Network error. Please check your connection and try again.');
      setLoadingRole(null);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* Main Selection Card */}
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-xl p-8 md:p-12">
        
        {/* Header Section */}
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Select Your Role
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
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
            colorClass="bg-blue-600" 
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
            colorClass="bg-blue-600"
            onClick={handleRoleSelect}
            isLoading={loadingRole === 'RECRUITER'}
          />

        </div>
      </div>
    </div>
  );
}