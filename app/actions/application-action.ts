'use server';

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ApplicationStatus } from '@prisma/client';
import nodemailer from 'nodemailer';
import { revalidatePath } from 'next/cache';

// gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // app password
  },
});

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus
) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify recruiter role and company access
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        role: true,
        recruiterProfile: {
          select: { companyId: true }
        }
      }
    });

    if (!user || user.role !== 'RECRUITER') {
      return { success: false, error: 'Unauthorized: Not a recruiter' };
    }

    // Fetch application with candidate and job details
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: {
          include: {
            user: {
              select: { email: true }
            }
          }
        },
        jobPosting: {
          include: {
            company: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!application) {
      return { success: false, error: 'Application not found' };
    }

    // Verify the application belongs to recruiter's company
    if (application.jobPosting.company.id !== user.recruiterProfile?.companyId) {
      return { success: false, error: 'Unauthorized: Application does not belong to your company' };
    }

    // Update application status
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: newStatus }
    });

    // Prepare email content
    const candidateEmail = application.candidate.user.email;
    const jobTitle = application.jobPosting.title;
    const companyName = application.jobPosting.company.name;

    let emailSubject = '';
    let emailContent = '';

    if (newStatus === 'OFFERED') {
      emailSubject = `Congratulations! You've been shortlisted at ${companyName}`;
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">Congratulations! 🎉</h2>
          <p>Dear Candidate,</p>
          <p>We are pleased to inform you that you have been <strong>shortlisted for the next round</strong> for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
          <p>Your application and AI screening interview impressed us, and we would like to move forward with you in our hiring process.</p>
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Our team will contact you shortly with further details</li>
            <li>Please keep an eye on your email for interview scheduling</li>
          </ul>
          <p>We look forward to speaking with you soon!</p>
          <br/>
          <p>Best regards,<br/>
          <strong>${companyName} Hiring Team</strong></p>
        </div>
      `;
    } else if (newStatus === 'REJECTED') {
      emailSubject = `Update on your application at ${companyName}`;
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6b7280;">Application Update</h2>
          <p>Dear Candidate,</p>
          <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> and for taking the time to complete our application process.</p>
          <p>After careful consideration of your application and qualifications, we have decided to move forward with other candidates whose experience more closely matches our current needs.</p>
          <p>We appreciate the time and effort you invested in applying, and we encourage you to explore other opportunities with us in the future.</p>
          <p>We wish you the very best in your job search and career endeavors.</p>
          <br/>
          <p>Best regards,<br/>
          <strong>${companyName} Hiring Team</strong></p>
        </div>
      `;
    }

    // Send email using Gmail SMTP
    if (emailSubject && emailContent) {
      await transporter.sendMail({
        from: `${companyName} Hiring <${process.env.GMAIL_USER}>`,
        to: candidateEmail,
        subject: emailSubject,
        html: emailContent,
      });
    }

    // Revalidate the application page
    revalidatePath(`/recruiter/applications/${applicationId}`);

    return { 
      success: true, 
      message: `Application ${newStatus === 'OFFERED' ? 'accepted' : 'rejected'} and email sent successfully` 
    };

  } catch (error) {
    console.error('Error updating application status:', error);
    return { 
      success: false, 
      error: 'Failed to update application status. Please try again.' 
    };
  }}