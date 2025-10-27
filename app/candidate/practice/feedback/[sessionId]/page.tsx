"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle,
  TrendingUp,
  FileText,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";

type FeedbackData = {
  id: string;
  sessionType: string;
  transcript: string;
  aiFeedback: string;
  score: number;
  createdAt: string;
};

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeedback() {
      try {
        const res = await fetch(`/api/candidate/interview/${sessionId}`);
        console.log("response: ", res);
        const data = await res.json();

        if (!data.success) {
          setError(data.message || "Failed to load feedback");
          setLoading(false);
          return;
        }

        setFeedback(data.session);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching feedback:", err);
        setError("Failed to load interview feedback");
        setLoading(false);
      }
    }

    if (sessionId) {
      fetchFeedback();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground">
            {error || "Feedback not found"}
          </p>
          <button
            onClick={() => router.push("/candidate/practice")}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Practice
          </button>
        </div>
      </div>
    );
  }

  const scoreColor =
    feedback.score >= 80
      ? "text-green-600"
      : feedback.score >= 60
      ? "text-yellow-600"
      : "text-red-600";

  const scoreMessage =
    feedback.score >= 80
      ? "Excellent Performance!"
      : feedback.score >= 60
      ? "Good Effort!"
      : "Keep Practicing!";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/candidate/practice")}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Practice</span>
          </button>

          <button
            onClick={() => router.push("/candidate/practice")}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <RotateCcw className="h-4 w-4" />
            <span>New Practice Session</span>
          </button>
        </div>

        {/* Title */}
        <div className="text-center space-y-2 border-b border-border pb-6 mb-8">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
          <h1 className="text-4xl font-bold text-primary">
            Interview Complete!
          </h1>
          <p className="text-lg text-muted-foreground">
            Here&apos;s your performance feedback
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-br from-chart-2/10 to-chart-3/10 border border-border rounded-xl p-8 shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-chart-2" />
                <h2 className="text-2xl font-bold text-foreground">
                  Overall Score
                </h2>
              </div>
              <p className="text-muted-foreground">
                Based on your interview performance
              </p>
            </div>
            <div className="text-center">
              <div className={`text-6xl font-bold ${scoreColor}`}>
                {feedback.score}
              </div>
              <p className={`text-lg font-semibold ${scoreColor}`}>
                {scoreMessage}
              </p>
            </div>
          </div>
        </div>

        {/* AI Feedback */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg space-y-4 mb-8">
          <div className="flex items-center space-x-3 border-b border-border pb-4">
            <FileText className="h-6 w-6 text-chart-3" />
            <h2 className="text-2xl font-bold text-foreground">
              AI Feedback & Analysis
            </h2>
          </div>

          <div className="prose prose-sm max-w-none">
            {feedback.aiFeedback ? (
              <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {feedback.aiFeedback}
              </div>
            ) : (
              <div className="text-muted-foreground italic">
                Feedback is being generated. Please refresh the page in a
                moment.
              </div>
            )}
          </div>
        </div>

        {/* Transcript */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg space-y-4 mb-8">
          <div className="flex items-center space-x-3 border-b border-border pb-4">
            <FileText className="h-6 w-6 text-chart-1" />
            <h2 className="text-2xl font-bold text-foreground">
              Interview Transcript
            </h2>
          </div>

          <div className="bg-muted/30 rounded-lg p-6 max-h-96 overflow-y-auto">
            {feedback.transcript ? (
              <div className="text-sm text-foreground/80 font-mono leading-relaxed whitespace-pre-wrap">
                {feedback.transcript}
              </div>
            ) : (
              <div className="text-muted-foreground italic">
                No transcript available for this session.
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>
            Session Type:{" "}
            <span className="font-semibold">{feedback.sessionType}</span>
          </p>
          <p>
            Completed:{" "}
            <span className="font-semibold">
              {new Date(feedback.createdAt).toLocaleString()}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
