"use client"

import { vapi } from "@/lib/vapi";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface VapiWidgetProps {
  assistantId: string;
  config?: Record<string, unknown>;
  sessionId?: string;
  redirectOnEnd?: string;
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

  // Auto-scroll for messages
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
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

      let score = Math.min(userMessages.length * 15, 60);
      score += Math.min(avgWords * 2, 40);

      return Math.min(Math.round(score), 100);
    };
    // Save interview data function - defined inside useEffect to avoid dependency issues
    const saveInterviewData = async (msgs: any[], callId: string | null) => {
      if (!sessionId || msgs.length === 0) {
        console.log('Skipping save: no sessionId or messages');
        return;
      }

      try {
        console.log("Saving interview data...", { messageCount: msgs.length });

        const transcript = msgs
          .map(msg => `${msg.role === 'assistant' ? 'AI' : 'User'}: ${msg.content}`)
          .join('\n\n');

        const aiFeedback = generateSimpleFeedback(msgs);
        const score = calculateScore(msgs);

        console.log("Sending data to API:", {
          transcriptPreview: transcript.substring(0, 100),
          score,
          sessionId
        });

        const response = await fetch(`/api/candidate/interview/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vapiCallId: callId || `call_${Date.now()}`,
            transcript,
            aiFeedback,
            score,
          }),
        });

        // Check if response has content before parsing
        const text = await response.text();
        console.log('API Response status:', response.status);
        console.log('API Response text:', text);

        let result;
        try {
          result = text ? JSON.parse(text) : {};
        } catch (e) {
          console.error('Failed to parse response:', e);
          result = { error: 'Invalid JSON response' };
        }

        console.log('Interview data save response:', result);

        if (!response.ok) {
          console.error('Failed to save interview data:', result);
        }
      } catch (error) {
        console.error('Error saving interview data:', error);
      }
    };
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
      if (sessionId && messages.length > 0) {
        await saveInterviewData(messages, vapiCallId);

        // Redirect after saving data
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

    return () => {
      vapi
        .off("call-start", handleCallStart)
        .off("call-end", handleCallEnd)
        .off("speech-start", handleSpeechStart)
        .off("speech-end", handleSpeechEnd)
        .off("message", handleMessage)
        .off("error", handleError);
    };
  }, [sessionId, messages, vapiCallId, redirectOnEnd, router, ]);

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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* HEADER */}
        <header className="text-center border-b border-border/80 pb-6 mb-8">
          <Bot className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="text-4xl font-serif font-extrabold tracking-tight text-primary">
            {sessionId ? "AI Interview Session" : "AI Assistant"}
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            {sessionId
              ? "Have a realistic interview conversation with our AI interviewer"
              : "Have a voice conversation with our AI assistant"}
          </p>
        </header>

        {/* VIDEO CALL CARDS */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* AI ASSISTANT CARD */}
          <div className="p-8 bg-card border border-border rounded-xl shadow-lg">
            <div className="flex flex-col items-center justify-center space-y-6 relative min-h-[320px]">
              {/* VOICE WAVE ANIMATION */}
              <div
                className={`absolute inset-0 transition-opacity duration-300 ${
                  isSpeaking ? "opacity-30" : "opacity-0"
                }`}
              >
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-center items-center h-20">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`mx-1 w-1 bg-primary rounded-full transition-all duration-150 ${
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
              <div className="relative size-24 mb-4">
                <div
                  className={`absolute inset-0 bg-primary rounded-full blur-lg transition-opacity duration-300 ${
                    isSpeaking ? "animate-pulse opacity-20" : "opacity-10"
                  }`}
                />
                <div className="relative w-full h-full rounded-full bg-card flex items-center justify-center border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-primary/5" />
                  <Bot
                    className={`h-10 w-10 transition-all duration-300 ${
                      isSpeaking ? "scale-110 text-primary" : "text-foreground"
                    }`}
                  />
                  {isSpeaking && (
                    <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-50" />
                  )}
                </div>
              </div>

              {/* AI INFO */}
              <div className="text-center">
                <h2 className="text-2xl font-serif font-bold text-secondary-foreground">
                  {sessionId ? "AI Interviewer" : "AI Assistant"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {sessionId ? "Professional Interviewer" : "Your Assistant"}
                </p>
              </div>

              {/* AI STATUS INDICATOR */}
              <div
                className={`flex items-center space-x-3 px-4 py-2 rounded-full bg-card border transition-colors duration-300 ${
                  isSpeaking ? "border-primary" : "border-border"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Bot
                    className={`h-4 w-4 transition-colors duration-300 ${
                      isSpeaking ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  {isSpeaking && (
                    <div className="absolute -inset-1 rounded-full border-2 border-primary animate-ping opacity-50" />
                  )}
                </div>
                <span className="text-sm font-medium text-muted-foreground">
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
          </div>

          {/* USER CARD */}
          <div className="p-8 bg-card border border-border rounded-xl shadow-lg">
            <div className="flex flex-col items-center justify-center space-y-6 min-h-[320px]">
              {/* USER IMAGE */}
              <div className="relative size-24 mb-4 rounded-full overflow-hidden border-2 border-border">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-muted-foreground"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* USER INFO */}
              <div className="text-center">
                <h2 className="text-2xl font-serif font-bold text-secondary-foreground">
                  You
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {user
                    ? (user.firstName + " " + (user.lastName || "")).trim()
                    : "Guest"}
                </p>
              </div>

              {/* USER STATUS INDICATOR */}
              <div
                className={`flex items-center space-x-3 px-4 py-2 rounded-full bg-card border transition-colors duration-300 ${
                  callActive && !isSpeaking ? "border-primary" : "border-border"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <svg
                    className={`h-4 w-4 transition-colors duration-300 ${
                      callActive && !isSpeaking
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  {callActive && !isSpeaking && (
                    <div className="absolute -inset-1 rounded-full border-2 border-primary animate-ping opacity-50" />
                  )}
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {callActive && !isSpeaking ? "Speaking..." : "Ready"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MESSAGE CONTAINER */}
        {messages.length > 0 && (
          <div
            ref={messageContainerRef}
            className="w-full p-6 bg-card border border-border rounded-xl shadow-lg mb-8 h-64 overflow-y-auto transition-all duration-300 scroll-smooth"
          >
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className="animate-in fade-in duration-300">
                  <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    {msg.role === "assistant"
                      ? sessionId
                        ? "AI Interviewer"
                        : "AI Assistant"
                      : "You"}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              ))}

              {callEnded && (
                <div className="animate-in fade-in duration-300 pt-4 border-t border-border">
                  <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">
                    System
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {sessionId
                      ? "Interview completed! Redirecting to feedback..."
                      : "Call ended. Thank you!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CALL CONTROLS */}
        <div className="flex justify-center">
          <button
            onClick={toggleCall}
            disabled={connecting || callEnded}
            className={`w-full max-w-md flex items-center justify-center space-x-2 py-3 px-6 rounded-md font-sans font-semibold text-lg tracking-wide ${
              callActive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : callEnded
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-chart-2 text-primary-foreground hover:bg-chart-2/90"
            } transition-opacity duration-300 shadow-md ${
              connecting || callEnded ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {connecting && <Loader2 className="h-5 w-5 animate-spin" />}
            <span>
              {callActive
                ? "End Call"
                : connecting
                ? "Connecting..."
                : callEnded
                ? "Call Ended"
                : "Start Call"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}