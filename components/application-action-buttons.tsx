'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ApplicationStatus } from '@prisma/client';
import { updateApplicationStatus } from '@/app/actions/application-action';

export function ApplicationActionButtons({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleStatusUpdate = async (status: ApplicationStatus) => {
    if (!confirm(`Are you sure you want to ${status === 'OFFERED' ? 'accept' : 'reject'} this candidate?`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await updateApplicationStatus(applicationId, status);

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Status updated successfully!'
        });
        // Refresh the page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to update status'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred'
      });
      console.error('Status Update Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
            : 'bg-red-500/10 text-red-500 border border-red-500/20'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => handleStatusUpdate('OFFERED')}
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          <span className="font-semibold">Accept Candidate</span>
        </button>

        <button
          onClick={() => handleStatusUpdate('REJECTED')}
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span className="font-semibold">Reject Candidate</span>
        </button>
      </div>
    </div>
  );
}