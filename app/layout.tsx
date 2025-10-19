import { Plus_Jakarta_Sans, Lora, Roboto_Mono } from 'next/font/google';
import './globals.css'; // Your custom theme file
import Providers from './providers'; // Import the external providers component
import React from 'react';

// Define your custom fonts using next/font
const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans', 
});

const fontSerif = Lora({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-serif', 
});

const fontMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono', 
});

export const metadata = {
  title: 'Entrevisto | AI Interview Screening Platform',
  description: 'AI-Powered Talent Acquisition for Recruiters and Candidates.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      // Apply font variables to html tag
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}
      suppressHydrationWarning // Prevents minor hydration warnings from dark mode setup
    >
      <body 
        // Apply base styles and font (font-sans is mapped in globals.css)
        className="min-h-screen antialiased font-sans"
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
