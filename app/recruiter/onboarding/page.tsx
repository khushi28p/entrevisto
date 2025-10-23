'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Loader2, Briefcase, Globe, Info, Factory } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

// Reusable Button component (using custom theme classes)
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
                bg-chart-1 text-primary-foreground hover:bg-chart-1/90 
                transition-opacity duration-300 shadow-md
                ${(disabled || loading) ? 'opacity-60 cursor-not-allowed' : ''}
                ${className}`}
  >
    {loading && <Loader2 className="h-5 w-5 animate-spin" />}
    <span>{children}</span>
  </button>
);

// Reusable Input component
const FormInput = ({ label, id, value, onChange, placeholder, icon: Icon, type = 'text', required = false }: {
    label: string, id: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, placeholder: string, icon: React.ElementType, type?: string, required?: boolean
}) => (
    <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground flex items-center space-x-2">
            <Icon className="h-4 w-4 text-primary" />
            <span>{label} {required && <span className="text-destructive">*</span>}</span>
        </label>
        {type === 'textarea' ? (
             <textarea
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={4}
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


export default function RecruiterOnboardingPage() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    companyIndustry: '',
    companyWebsite: '',
    companyDescription: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  // NOTE: If you need to enforce RECRUITER role access, you would add logic here
  // to redirect if the user's role in the DB/publicMetadata is not RECRUITER.
  
  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    if (!formData.companyName || !formData.companyIndustry) {
        setError("Please fill in the Company Name and Industry fields.");
        setLoading(false);
        return;
    }

    try {
      const response = await fetch('/api/recruiter/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        // Handle server-side errors, including validation failures from the API
        const errorData = await response.json().catch(() => ({ message: 'Failed to onboard recruiter.' }));
        setError(errorData.message || response.statusText);
        setLoading(false);
        return;
      }
      
      // On successful onboarding, redirect to the recruiter dashboard
      router.push('/recruiter/dashboard'); 

    } catch (e) {
      console.error('Onboarding Network Error:', e);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-8 bg-background text-foreground font-sans">
      
      <div className="w-full max-w-xl bg-card text-card-foreground border border-border shadow-2xl rounded-xl p-8 md:p-10">
        
        <header className="text-center mb-8">
          <Briefcase className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-serif font-extrabold tracking-tight text-primary">
            Recruiter Onboarding
          </h1>
          <p className="mt-2 text-md text-muted-foreground">
            Tell us about your company to start posting jobs. This step links your profile to a *Company* entity.
          </p>
        </header>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          
          <FormInput 
            label="Company Name"
            id="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="e.g., Entrevisto Inc."
            icon={Briefcase}
            required={true}
          />
          
          <FormInput 
            label="Industry"
            id="companyIndustry"
            value={formData.companyIndustry}
            onChange={handleChange}
            placeholder="e.g., Software Development, Healthcare"
            icon={Factory}
            required={true}
          />
          
          <FormInput 
            label="Website URL"
            id="companyWebsite"
            value={formData.companyWebsite}
            onChange={handleChange}
            placeholder="e.g., https://www.entrevisto.ai"
            icon={Globe}
            type="url"
          />

          <FormInput 
            label="Company Description (Optional)"
            id="companyDescription"
            value={formData.companyDescription}
            onChange={handleChange}
            placeholder="A brief summary of your company's mission and culture."
            icon={Info}
            type="textarea"
          />

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive-foreground p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <ThemeButton 
            onClick={handleSubmit} 
            loading={loading}
            disabled={loading || !formData.companyName || !formData.companyIndustry}
            className="mt-8"
          >
            Complete Onboarding
          </ThemeButton>
        </form>
      </div>
    </div>
  );
}