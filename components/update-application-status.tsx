// 'use client';

// import React, { useState } from 'react';
// import { Loader2, Check, X, ThumbsUp } from 'lucide-react';
// import { ApplicationStatus } from '@prisma/client';
// import { useRouter } from 'next/navigation';

// interface UpdateStatusProps {
//     applicationId: string;
//     currentStatus: ApplicationStatus;
//     updateAction: (status: ApplicationStatus) => Promise<{ success: boolean; error?: string }>;
// }

// const statusOptions: { value: ApplicationStatus; label: string; icon: React.ElementType }[] = [
//     { value: ApplicationStatus.REVIEWED_BY_RECRUITER, label: 'Mark as Reviewed', icon: Check },
//     { value: ApplicationStatus.OFFERED, label: 'Send Offer', icon: ThumbsUp },
//     { value: ApplicationStatus.REJECTED, label: 'Reject Candidate', icon: X },
// ];

// export default function UpdateApplicationStatus({ currentStatus, updateAction }: UpdateStatusProps) {
//     const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(currentStatus);
//     const [isLoading, setIsLoading] = useState(false);
//     const [message, setMessage] = useState<string | null>(null);
//     const router = useRouter();

//     const handleUpdate = async () => {
//         if (selectedStatus === currentStatus) {
//             setMessage("Status is already set to this value.");
//             return;
//         }

//         setIsLoading(true);
//         setMessage(null);

//         const result = await updateAction(selectedStatus);

//         if (result.success) {
//             setMessage(`Status successfully updated to ${selectedStatus.replace(/_/g, ' ')}!`);
//             // Refresh the page to show the new status badge
//             router.refresh(); 
//         } else {
//             setMessage(`Error: ${result.error || 'Could not update status.'}`);
//         }
//         setIsLoading(false);
//     };

//     return (
//         <div className="space-y-4">
//             <div className="flex flex-wrap items-center gap-4">
//                 <select
//                     value={selectedStatus}
//                     onChange={(e) => setSelectedStatus(e.target.value as ApplicationStatus)}
//                     className="p-3 border border-border rounded-md bg-input text-foreground font-medium shadow-sm focus:ring-ring focus:border-primary/50"
//                     disabled={isLoading}
//                 >
//                     <option value={currentStatus} disabled>Select Action</option>
//                     {statusOptions.map(option => (
//                         <option key={option.value} value={option.value} disabled={option.value === currentStatus}>
//                             {option.label}
//                         </option>
//                     ))}
//                 </select>

//                 <button
//                     onClick={handleUpdate}
//                     disabled={isLoading || selectedStatus === currentStatus}
//                     className={`flex items-center space-x-2 px-6 py-3 rounded-md font-semibold transition-colors shadow-md 
//                                 ${isLoading 
//                                     ? 'bg-accent text-accent-foreground cursor-not-allowed'
//                                     : 'bg-primary text-primary-foreground hover:bg-primary/90'
//                                 }`}
//                 >
//                     {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
//                     <span>Confirm Status Update</span>
//                 </button>
//             </div>
            
//             {message && (
//                 <div className={`p-3 rounded-md text-sm ${message.startsWith('Error') ? 'bg-destructive/10 text-destructive-foreground' : 'bg-chart-1/10 text-chart-1'}`}>
//                     {message}
//                 </div>
//             )}
//         </div>
//     );
// }
