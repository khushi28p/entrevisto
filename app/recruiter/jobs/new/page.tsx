'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Loader2, Briefcase, FileText, CheckCircle, Save } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

// --- Reusable Themed Components (Assuming standard imports or local components) ---

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
                bg-primary text-primary-foreground hover:bg-primary/90 
                transition-opacity duration-300 shadow-md
                ${(disabled || loading) ? 'opacity-60 cursor-not-allowed' : ''}
                ${className}`}
  >
    {loading && <Loader2 className="h-5 w-5 animate-spin" />}
    <span>{children}</span>
  </button>
);

const FormInput = ({ label, id, value, onChange, placeholder, icon: Icon, type = 'text', required = false, isTextArea = false }: {
    label: string, id: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, placeholder: string, icon: React.ElementType, type?: string, required?: boolean, isTextArea?: boolean
}) => (
    <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground flex items-center space-x-2">
            <Icon className="h-4 w-4 text-primary" />
            <span>{label} {required && <span className="text-destructive">*</span>}</span>
        </label>
        {isTextArea ? (
             <textarea
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={isTextArea ? 6 : 1}
                required={required}
                className="w-full p-3 border border-border rounded-md bg-input text-foreground focus:ring-2 focus:ring-ring transition-colors focus:border-primary/50"
             />
        ) : (
             <input
                type={type}
                id={id}
                value={value}
                onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
                placeholder={placeholder}
                required={required}
                className="w-full p-3 border border-border rounded-md bg-input text-foreground focus:ring-2 focus:ring-ring transition-colors focus:border-primary/50"
             />
        )}
       
    </div>
);

// --- Main Component ---

export default function NewJobPostingPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '', // Critical for Vapi AI prompt
    isActive: true,
  });

  // Simple client-side fetch to get company name for UI context
  useEffect(() => {
    if (!userId) return;

    const fetchCompanyInfo = async () => {
      try {
        // NOTE: This assumes you have an API route to fetch recruiter data 
        // We'll skip creating that route for now and simulate the data if not found.
        const response = await fetch('/api/recruiter/company-info'); 
        if (response.ok) {
          const data = await response.json();
          setCompanyName(data.companyName);
        } else {
           // Simulate if API route is not yet implemented
           setCompanyName("Your Company"); 
        }
      } catch (e) {
        setCompanyName("Your Company");
      }
    };
    fetchCompanyInfo();
  }, [userId]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const isCheckbox = type === 'checkbox';

    setFormData({
      ...formData,
      [id]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    });
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  // NOTE: Full authorization check (e.g., ensuring role is RECRUITER) should happen here, 
  // but for now, we rely on middleware protecting the /recruiter/* path.

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    if (!formData.title || !formData.description || !formData.requirements) {
        setError("Job Title, Description, and AI Requirements are mandatory.");
        setLoading(false);
        return;
    }

    try {
      // API call to the new job creation endpoint
      const response = await fetch('/api/recruiter/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create job posting.' }));
        setError(errorData.message || response.statusText);
        setLoading(false);
        return;
      }
      
      // On successful creation, redirect to the dashboard
      router.push('/recruiter/dashboard'); 

    } catch (e) {
      console.error('Job Creation Network Error:', e);
      setError('A network error occurred while posting the job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-8 bg-background text-foreground font-sans">
      
      <div className="w-full max-w-2xl bg-card text-card-foreground border border-border shadow-2xl rounded-xl p-8 md:p-10">
        
        <header className="text-center mb-8">
          <Briefcase className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-serif font-extrabold tracking-tight text-primary">
            Post a New Job
          </h1>
          <p className="mt-2 text-md text-muted-foreground">
            Create a new opening for {companyName} and define the screening requirements for the Vapi AI agent.
          </p>
        </header>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          
          <FormInput 
            label="Job Title"
            id="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Senior Frontend Developer"
            icon={Briefcase}
            required={true}
          />
          
          <FormInput 
            label="Job Description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Outline the role, responsibilities, and team structure."
            icon={FileText}
            isTextArea={true}
            required={true}
          />
          
          <div className="border border-border p-4 rounded-md bg-secondary/20 space-y-4">
              <h3 className="text-lg font-serif font-semibold text-secondary-foreground flex items-center space-x-2">
                <BrainCircuit className="h-5 w-5 text-chart-3" />
                <span>AI Screening Requirements (Critical)</span>
              </h3>
              <p className="text-sm text-muted-foreground">
                **IMPORTANT:** Provide a comma-separated list of technical skills, behavioral traits, and key experiences the AI interview agent must validate. This guides the Vapi questions.
              </p>
              <FormInput 
                label="Required Skills & Traits"
                id="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="e.g., React, TypeScript, Redux, Asynchronous Programming, Problem Solving, Leadership"
                icon={ListChecks}
                isTextArea={true}
                required={true}
              />
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-5 w-5 text-primary bg-input border-border rounded shadow-sm focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-foreground flex items-center space-x-1 cursor-pointer">
                <CheckCircle className="h-4 w-4 text-chart-1" />
                <span>Make Job Posting Active immediately</span>
            </label>
          </div>


          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive-foreground p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <ThemeButton 
            onClick={handleSubmit} 
            loading={loading}
            disabled={loading || !formData.title || !formData.description || !formData.requirements}
            className="mt-8"
          >
            <Save className="h-5 w-5" />
            <span>Save & Publish Job</span>
          </ThemeButton>
        </form>
      </div>
    </div>
  );
}
