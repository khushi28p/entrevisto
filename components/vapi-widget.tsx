"use client"

import { vapi } from "@/lib/vapi";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { Card } from "./ui/card";
import { MailOpenIcon } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

interface VapiWidgetProps {
  assistantId: string;
  config?: Record<string, unknown>;
  sessionId?: string; // NEW: Optional session ID for practice interviews
  redirectOnEnd?: string; // NEW: Optional redirect URL after call ends
}

export default function VapiWidget({ 
  assistantId, 
  config = {}, 
  sessionId,
  redirectOnEnd 
}: VapiWidgetProps) {
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [callEnded, setCallEnded] = useState(false);
  const [vapiCallId, setVapiCallId] = useState<string | null>(null);

  const { user, isLoaded } = useUser();
  const router = useRouter();
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // auto-scroll for messages
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Save interview data when call ends (for practice sessions)
  const saveInterviewData = async () => {
    if (!sessionId || messages.length === 0) return;

    try {
      // Build transcript from messages
      const transcript = messages
        .map(msg => `${msg.role === 'assistant' ? 'AI' : 'User'}: ${msg.content}`)
        .join('\n\n');

      // Generate simple feedback (you can enhance this with AI later)
      const aiFeedback = generateSimpleFeedback(messages);
      const score = calculateScore(messages);

      await fetch(`/api/candidate/interview/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vapiCallId: vapiCallId || `call_${Date.now()}`,
          transcript,
          aiFeedback,
          score,
        }),
      });

      console.log('Interview data saved successfully');
    } catch (error) {
      console.error('Error saving interview data:', error);
    }
  };

  // Simple feedback generator
  const generateSimpleFeedback = (msgs: any[]): string => {
    const userMessages = msgs.filter(m => m.role === 'user');
    const totalWords = userMessages.reduce((sum, m) => sum + m.content.split(' ').length, 0);
    const avgWordsPerResponse = userMessages.length > 0 ? Math.round(totalWords / userMessages.length) : 0;

    return `Interview Summary:
- Total Responses: ${userMessages.length}
- Average Response Length: ${avgWordsPerResponse} words
- Communication: ${avgWordsPerResponse > 20 ? 'Detailed and thorough' : 'Concise'}

Strengths:
- You participated actively in the interview
- Your responses were ${avgWordsPerResponse > 15 ? 'well-articulated' : 'clear and to the point'}

Areas for Improvement:
- ${avgWordsPerResponse < 15 ? 'Consider providing more detailed examples in your responses' : 'Continue practicing to maintain consistency'}
- Focus on highlighting specific achievements and metrics

Keep practicing to improve your interview skills!`;
  };

  // Simple scoring logic
  const calculateScore = (msgs: any[]): number => {
    const userMessages = msgs.filter(m => m.role === 'user');
    if (userMessages.length === 0) return 0;

    const totalWords = userMessages.reduce((sum, m) => sum + m.content.split(' ').length, 0);
    const avgWords = totalWords / userMessages.length;

    // Base score on response count and length
    let score = Math.min(userMessages.length * 15, 60); // Up to 60 points for responses
    score += Math.min(avgWords * 2, 40); // Up to 40 points for response length

    return Math.min(Math.round(score), 100);
  };

  useEffect(() => {
    const handleCallStart = () => {
      console.log("Call started");
      setConnecting(false);
      setCallActive(true);
      setCallEnded(false);
    };

    const handleCallEnd = async () => {
      console.log("Call ended");
      setCallActive(false);
      setConnecting(false);
      setIsSpeaking(false);
      setCallEnded(true);

      // Save interview data if sessionId exists
      if (sessionId) {
        await saveInterviewData();
        
        // Redirect after saving data (with delay for user to see "Call ended" message)
        setTimeout(() => {
          if (redirectOnEnd) {
            router.push(redirectOnEnd);
          } else {
            router.push(`/candidate/practice/feedback/${sessionId}`);
          }
        }, 2000);
      }
    };

    const handleSpeechStart = () => {
      console.log("AI started Speaking");
      setIsSpeaking(true);
    };

    const handleSpeechEnd = () => {
      console.log("AI stopped Speaking");
      setIsSpeaking(false);
    };

    const handleMessage = (message: any) => {
      // Capture Vapi call ID
      if (message.call?.id) {
        setVapiCallId(message.call.id);
      }

      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { content: message.transcript, role: message.role };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const handleError = (error: any) => {
      console.log("Vapi Error", error);
      setConnecting(false);
      setCallActive(false);
    };

    vapi
      .on("call-start", handleCallStart)
      .on("call-end", handleCallEnd)
      .on("speech-start", handleSpeechStart)
      .on("speech-end", handleSpeechEnd)
      .on("message", handleMessage)
      .on("error", handleError);

    // cleanup event listeners on unmount
    return () => {
      vapi
        .off("call-start", handleCallStart)
        .off("call-end", handleCallEnd)
        .off("speech-start", handleSpeechStart)
        .off("speech-end", handleSpeechEnd)
        .off("message", handleMessage)
        .off("error", handleError);
    };
  }, [sessionId, messages, vapiCallId, redirectOnEnd, router]);

  const toggleCall = async () => {
    if (callActive) vapi.stop();
    else {
      try {
        setConnecting(true);
        setMessages([]);
        setCallEnded(false);

        await vapi.start(assistantId, config);
      } catch (error) {
        console.log("Failed to start call", error);
        setConnecting(false);
      }
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 flex flex-col overflow-hidden pb-20">
      {/* TITLE */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-mono">
          <span>Talk to Your </span>
          <span className="text-primary uppercase">
            {sessionId ? "AI Interviewer" : "Assistant"}
          </span>
        </h1>
        <p className="text-muted-foreground mt-2">
          {sessionId 
            ? "Have a realistic interview conversation with our AI interviewer"
            : "Have a voice conversation with our AI assistant for dental advice and guidance"
          }
        </p>
      </div>

      {/* VIDEO CALL AREA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* AI ASSISTANT CARD */}
        <Card className="bg-card/90 backdrop-blur-sm border border-border overflow-hidden relative">
          <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
            {/* AI VOICE ANIMATION */}
            <div
              className={`absolute inset-0 ${
                isSpeaking ? "opacity-30" : "opacity-0"
              } transition-opacity duration-300`}
            >
              {/* voice wave animation when speaking */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-center items-center h-20">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`mx-1 h-16 w-1 bg-primary rounded-full ${
                      isSpeaking ? "animate-sound-wave" : ""
                    }`}
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      height: isSpeaking ? `${Math.random() * 50 + 20}%` : "5%",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* AI LOGO */}
            <div className="relative size-32 mb-4">
              <div
                className={`absolute inset-0 bg-primary opacity-10 rounded-full blur-lg ${
                  isSpeaking ? "animate-pulse" : ""
                }`}
              />

              <div className="relative w-full h-full rounded-full bg-card flex items-center justify-center border border-border overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-primary/5"></div>
                <Logo />
              </div>
            </div>

            <h2 className="text-xl font-bold text-foreground">
              {sessionId ? "AI Interviewer" : "DentWise AI"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {sessionId ? "Professional Interviewer" : "Dental Assistant"}
            </p>

            {/* SPEAKING INDICATOR */}
            <div
              className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border ${
                isSpeaking ? "border-primary" : ""
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isSpeaking ? "bg-primary animate-pulse" : "bg-muted"
                }`}
              />

              <span className="text-xs text-muted-foreground">
                {isSpeaking
                  ? "Speaking..."
                  : callActive
                  ? "Listening..."
                  : callEnded
                  ? "Call ended"
                  : "Waiting..."}
              </span>
            </div>
          </div>
        </Card>

        {/* USER CARD */}
        <Card className={`bg-card/90 backdrop-blur-sm border overflow-hidden relative`}>
          <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
            {/* User Image */}
            <div className="relative size-32 mb-4">
              <MailOpenIcon />
            </div>

            <h2 className="text-xl font-bold text-foreground">You</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {user ? (user.firstName + " " + (user.lastName || "")).trim() : "Guest"}
            </p>

            {/* User Ready Text */}
            <div className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border`}>
              <div className={`w-2 h-2 rounded-full bg-muted`} />
              <span className="text-xs text-muted-foreground">Ready</span>
            </div>
          </div>
        </Card>
      </div>

      {/* MESSAGE CONTAINER */}
      {messages.length > 0 && (
        <div
          ref={messageContainerRef}
          className="w-full bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 mb-8 h-64 overflow-y-auto transition-all duration-300 scroll-smooth"
        >
          <div className="space-y-3">
            {messages.map((msg, index) => (
              <div key={index} className="message-item animate-in fade-in duration-300">
                <div className="font-semibold text-xs text-muted-foreground mb-1">
                  {msg.role === "assistant" 
                    ? (sessionId ? "AI Interviewer" : "DentWise AI")
                    : "You"}:
                </div>
                <p className="text-foreground">{msg.content}</p>
              </div>
            ))}

            {callEnded && (
              <div className="message-item animate-in fade-in duration-300">
                <div className="font-semibold text-xs text-primary mb-1">System:</div>
                <p className="text-foreground">
                  {sessionId 
                    ? "Interview completed! Redirecting to feedback..." 
                    : "Call ended. Thank you for using DentWise AI!"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CALL CONTROLS */}
      <div className="w-full flex justify-center gap-4">
        <Button
          className={`w-44 text-xl rounded-3xl ${
            callActive
              ? "bg-destructive hover:bg-destructive/90"
              : callEnded
              ? "bg-red-500 hover:bg-red-700"
              : "bg-primary hover:bg-primary/90"
          } text-white relative`}
          onClick={toggleCall}
          disabled={connecting || callEnded}
        >
          {connecting && (
            <span className="absolute inset-0 rounded-full animate-ping bg-primary/50 opacity-75"></span>
          )}

          <span>
            {callActive
              ? "End Call"
              : connecting
              ? "Connecting..."
              : callEnded
              ? "Call Ended"
              : "Start Call"}
          </span>
        </Button>
      </div>
    </div>
  );
}