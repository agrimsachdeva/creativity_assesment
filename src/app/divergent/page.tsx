"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Background } from "../../components/shared/Background";
import { Header } from "../../components/shared/Header";
import { ChatInterface } from "../../components/shared/ChatInterface";
import { SessionInfo } from "../../components/shared/SessionInfo";
import { TaskDescription } from "../../components/shared/TaskDescription";
import { TelemetryDebugger } from "../../components/shared/TelemetryDebugger";
import { sendChatMessage } from "../../components/shared/api";
import { useTelemetry } from "../../components/shared/useTelemetry";
import { Message } from "../../components/shared/types";

function DivergentTaskApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [qualtricsId, setQualtricsId] = useState<string | null>(null);
  const [showTelemetryDebug, setShowTelemetryDebug] = useState(false);
  const [currentTelemetry, setCurrentTelemetry] = useState<any>(null);
  const searchParams = useSearchParams();

  // Initialize advanced telemetry
  const {
    sessionId,
    userId,
    startMessageComposition,
    updateMessageContent,
    completeMessage,
    recordAiResponse,
    recordResponseLatency,
    generateTelemetry
  } = useTelemetry("divergent");

  useEffect(() => {
    // Extract parameters from URL
    const id = searchParams.get("qualtricsId") || searchParams.get("id");
    if (id) setQualtricsId(id);
  }, [searchParams]);

  const handleStartComposition = () => {
    startMessageComposition();
  };

  const handleUpdateContent = (content: string) => {
    updateMessageContent(content);
  };

  const handleCompleteMessage = () => {
    completeMessage();
  };

  // Fixing error handling block and ensuring proper scoping of variables
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    const userMessage: Message = { role: "user", content: input, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Ensure telemetry is always valid
    const telemetry = generateTelemetry(
      null, // no rounds for divergent thinking
      null, // no word sets for divergent thinking
      0, // task progress placeholder
      false, // task completion placeholder
      input
    ) || {
      sessionId: sessionId,
      userId: userId,
      timestamp: Date.now(),
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      devicePixelRatio: window.devicePixelRatio,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      taskType: "divergent",
      taskProgress: 0,
      typingPattern: {
        totalKeypresses: 0,
        backspaceCount: 0,
        pauseCount: 0,
        avgTypingSpeed: 0,
        peakTypingSpeed: 0,
        keystrokeDynamics: { dwellTimes: [], flightTimes: [], rhythm: 0 },
        correctionRatio: 0,
        pauseDistribution: []
      },
      mouseActivity: [],
      keystrokeSequence: [],
      cognitiveLoad: {
        thinkingPauses: 0,
        avgThinkingTime: 0,
        longestPause: 0,
        editingBehavior: { revisions: 0, deletions: 0, insertions: 0, cursorMovements: 0 },
        responseLatency: 0,
        taskSwitching: 0
      },
      linguisticFeatures: {
        wordCount: 0,
        charCount: 0,
        avgWordLength: 0,
        sentenceCount: 0,
        avgSentenceLength: 0,
        vocabularyRichness: 0,
        readabilityScore: 0,
        semanticComplexity: 0,
        emotionalTone: { positive: 0, negative: 0, neutral: 1 },
        creativityIndicators: { uniqueWords: 0, metaphorCount: 0, questionCount: 0, ideaCount: 0 }
      },
      messageMetrics: {
        responseTime: 0,
        messageLength: 0,
        editCount: 0,
        finalMessageDifferentFromFirst: false
      },
      interactionSequence: [],
      sessionDuration: 0,
      totalMessages: 0,
      avgMessageInterval: 0,
      taskCompletion: false,
      featureVector: [],
      temporalFeatures: []
    };

    try {
      const aiMessage = await sendChatMessage([...messages, userMessage], "divergent", telemetry, qualtricsId);
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      let errorContent = "Sorry, I encountered an error. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("OpenAI API key not configured")) {
          errorContent = "🔧 The AI service is not yet configured. Please contact the administrator to set up the OpenAI API key.";
        } else if (error.message.includes("Invalid or expired OpenAI API key")) {
          errorContent = "🔑 The OpenAI API key appears to be invalid or expired. Please check the API key in your .env.local file and ensure it starts with 'sk-'.";
        } else if (error.message.includes("rate limit exceeded")) {
          errorContent = "⏱️ Too many requests to the AI service. Please wait a moment and try again.";
        } else if (error.message.includes("quota exceeded")) {
          errorContent = "💳 The OpenAI API quota has been exceeded. Please check your billing settings on the OpenAI platform.";
        } else if (error.message.includes("Failed to get AI response")) {
          errorContent = "🤖 I'm having trouble connecting to the AI service right now. Please try again in a moment.";
        } else if (error.message.includes("HTTP error")) {
          errorContent = "🌐 There's a connection issue. Please check your internet connection and try again.";
        }
      }

      const errorMessage: Message = {
        role: "assistant",
        content: errorContent,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  return (
    <Background>
      <Header 
        title="Divergent Thinking Lab"
        subtitle="Explore unlimited creative possibilities through open-ended ideation"
        taskType="divergent"
      />
      
      <ChatInterface
        messages={messages}
        input={input}
        loading={loading}
        taskType="divergent"
        onInputChange={setInput}
        onSendMessage={handleSendMessage}
        onStartComposition={handleStartComposition}
        onUpdateContent={handleUpdateContent}
        onCompleteMessage={handleCompleteMessage}
        emptyStateTitle="Ready to Unleash Your Creativity?"
        emptyStateDescription="Let your imagination soar! Generate multiple unique ideas, explore unconventional solutions, and think beyond boundaries."
      />
      
      <SessionInfo 
        qualtricsId={qualtricsId} 
        sessionId={sessionId}
        userId={userId}
      />
      <TaskDescription taskType="divergent" />
    </Background>
  );
}

export default function DivergentPage() {
  return (
    <Suspense fallback={
      <Background>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </Background>
    }>
      <DivergentTaskApp />
    </Suspense>
  );
}
