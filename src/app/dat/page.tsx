"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Background } from "../../components/shared/Background";
import { Header } from "../../components/shared/Header";
import { ChatInterface } from "../../components/shared/ChatInterface";
import { SessionInfo } from "../../components/shared/SessionInfo";
import { TaskDescription } from "../../components/shared/TaskDescription";
import { DATDisplay } from "../../components/divergent/DATDisplay";
import { sendChatMessage, logTaskCompletion } from "../../components/shared/api";
import { useTelemetry } from "../../components/shared/useTelemetry";
import { Message } from "../../components/shared/types";

function DATTaskApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [qualtricsId, setQualtricsId] = useState<string | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [taskResponses, setTaskResponses] = useState<string[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState({
    copyPasteCount: 0,
    chatbotUsagePercentage: 0,
    chatbotEngagementCount: 0,
  });
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const searchParams = useSearchParams();

  // Initialize advanced telemetry
  const {
    sessionId,
    userId,
    isInitialized,
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
    
    // Initialize startTime on client side only
    setStartTime(new Date().toISOString());

    // Show initial AI help message in chat
    setMessages([
      {
        role: "assistant",
        content: "🧠 Welcome to the Divergent Association Task! I'm here to help you think of 10 words that are as different from each other as possible. Need suggestions, want to check if your words are diverse enough, or have questions about the rules? Just ask me!",
        timestamp: Date.now(),
      },
    ]);
  }, [searchParams]);

  const handleWordsChange = (newWords: string[]) => {
    setWords(newWords);
    // Update task responses with the current words
    setTaskResponses(newWords.filter(word => word.trim() !== ""));
  };

  const handleStartComposition = () => {
    startMessageComposition();
  };

  const handleUpdateContent = (content: string) => {
    updateMessageContent(content);
  };

  const handleCompleteMessage = () => {
    completeMessage();
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    const userMessage: Message = { role: "user", content: input, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); // Clear input immediately after sending

    // Generate telemetry
    const telemetry = generateTelemetry(
      1, // DAT is a single round task
      null,
      words.filter(w => w.trim() !== "").length > 0 ? (words.filter(w => w.trim() !== "").length / 10) * 100 : 0,
      completed,
      input
    );

    if (!telemetry) {
      console.error("Telemetry is null. Cannot proceed.");
      setLoading(false);
      return;
    }

    // Log required fields for debugging
    console.log("Debugging sendChatMessage fields:", {
      subjectId: sessionId,
      transcript,
      taskResponses,
      engagementMetrics,
      startTime,
      endTime: new Date().toISOString(),
    });

    try {
      const response = await sendChatMessage([...messages, userMessage]);

      // Log the full response object for debugging
      console.log("Server response:", response);

      // Update transcript and engagement metrics
      setTranscript((prev) => [...prev, { role: "user", content: input, timestamp: Date.now() }]);
      setEngagementMetrics((prev) => ({
        ...prev,
        chatbotEngagementCount: prev.chatbotEngagementCount + 1,
      }));

      // Handle response
      if (response && response.role && response.content) {
        setMessages((prev) => [...prev, response]);
      } else {
        console.error("Invalid response format:", response);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setLoading(false);
  };

  const handleComplete = () => {
    setCompleted(true);
  };

  const handleTaskCompletion = async () => {
    const endTime = new Date().toISOString();
    setEndTime(endTime);

    // Log required fields for debugging
    console.log("Logging task completion data:", {
      subjectId: sessionId,
      transcript,
      taskResponses,
      engagementMetrics,
      startTime,
      endTime,
    });

    // Create comprehensive telemetry data
    const defaultTelemetry = {
      sessionId: sessionId || "unknown",
      userId: userId || "unknown",
      timestamp: Date.now(),
      language: "en",
      platform: "web",
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      devicePixelRatio: window.devicePixelRatio,
      taskType: "divergent" as const,
      taskProgress: 100,
      currentRound: 1, // DAT is a single task
      currentWordSet: null,
      typingPattern: {
        totalKeypresses: 0,
        backspaceCount: 0,
        pauseCount: 0,
        avgTypingSpeed: 0,
        peakTypingSpeed: 0,
        keystrokeDynamics: {
          dwellTimes: [],
          flightTimes: [],
          rhythm: 0,
        },
        correctionRatio: 0,
        pauseDistribution: [],
      },
      mouseActivity: [],
      keystrokeSequence: [],
      cognitiveLoad: {
        thinkingPauses: 0,
        avgThinkingTime: 0,
        longestPause: 0,
        editingBehavior: {
          revisions: 0,
          deletions: 0,
          insertions: 0,
          cursorMovements: 0,
        },
        responseLatency: 0,
        taskSwitching: 0,
      },
      linguisticFeatures: {
        wordCount: words.filter(w => w.trim() !== "").length,
        charCount: words.join("").length,
        avgWordLength: words.filter(w => w.trim() !== "").reduce((acc, word) => acc + word.length, 0) / Math.max(1, words.filter(w => w.trim() !== "").length),
        sentenceCount: 0,
        avgSentenceLength: 0,
        vocabularyRichness: new Set(words.filter(w => w.trim() !== "").map(w => w.toLowerCase())).size,
        readabilityScore: 0,
        semanticComplexity: 0,
        emotionalTone: {
          positive: 0,
          negative: 0,
          neutral: 1,
        },
        creativityIndicators: {
          uniqueWords: new Set(words.filter(w => w.trim() !== "").map(w => w.toLowerCase())).size,
          metaphorCount: 0,
          questionCount: 0,
          ideaCount: words.filter(w => w.trim() !== "").length,
        },
      },
      messageMetrics: {
        responseTime: 0,
        messageLength: 0,
        editCount: 0,
        finalMessageDifferentFromFirst: false,
      },
      interactionSequence: [],
      sessionDuration: new Date(endTime).getTime() - new Date(startTime).getTime(),
      totalMessages: transcript.length,
      avgMessageInterval: 0,
      taskCompletion: true,
      qualityMetrics: {
        relevanceScore: 0,
        creativityScore: 0,
        coherenceScore: 0,
      },
      attentionTracking: {
        focusEvents: [],
        visibilityChanges: [],
        scrollBehavior: [],
      },
      featureVector: [],
      temporalFeatures: [],
    };

    try {
      await logTaskCompletion(
        sessionId,
        "divergent",
        transcript,
        words.filter(w => w.trim() !== ""), // Pass the actual words as task responses
        engagementMetrics,
        startTime,
        endTime,
        defaultTelemetry,
        qualtricsId
      );
      console.log("Task completion data logged successfully.");
    } catch (error) {
      console.error("Error logging task completion data:", error);
    }
  };

  // Call handleTaskCompletion when the task is marked as completed
  useEffect(() => {
    if (completed) {
      handleTaskCompletion();
    }
  }, [completed]);

  return (
    <Background>
      <div className="flex flex-col md:flex-row gap-8 items-stretch justify-center w-full px-2 md:px-8 py-6 md:py-10 min-h-[80vh]">
        
        {/* Left Panel - Task Interface */}
        <div className="flex-1 max-w-2xl bg-white/10 rounded-2xl p-4 md:p-6 border border-white/20 shadow-md flex flex-col justify-start min-h-[60vh]">
          <Header taskType="divergent" />
          <div className="mb-8" />
          
          {/* Custom Task Description for DAT */}
          <div className="backdrop-blur-sm bg-white/10 rounded-3xl p-6 border border-white/20 shadow-2xl mb-6">
            <div className="flex items-center mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center mr-3 bg-gradient-to-r from-purple-500 to-pink-500">
                🧠
              </div>
              <h3 className="text-xl font-bold text-white">
                Divergent Association Task (DAT)
              </h3>
            </div>
            <p className="text-white/80 leading-snug text-md">
              Generate 10 words that are as semantically different from each other as possible. This task measures your ability to access diverse concepts and think beyond conventional associations.
            </p>
          </div>

          {/* DAT Display */}
          <DATDisplay
            onWordsChange={handleWordsChange}
            onComplete={handleComplete}
            completed={completed}
          />

          {completed && (
            <div className="mt-4 text-green-400 text-lg text-center">
              🎉 Congratulations! You've completed the Divergent Association Task. Thank you for your creativity!
            </div>
          )}
          
          <div className="mt-8">
            <SessionInfo 
              sessionId={sessionId}
              qualtricsId={qualtricsId}
            />
          </div>
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="flex-1 max-w-2xl flex flex-col bg-white/10 rounded-2xl border border-white/20 shadow-md min-h-[60vh] max-h-[80vh] p-4 md:p-6">
          <div className="flex-1 flex flex-col min-h-0">
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
              emptyStateTitle="Ready to Explore Semantic Distance?"
              emptyStateDescription="Need help thinking of diverse words? Want to check if your words are different enough? I'm here to guide your creative thinking process!"
            />

          </div>
        </div>
      </div>
    </Background>
  );
}

export default function DATPage() {
  return (
    <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
      <DATTaskApp />
    </Suspense>
  );
}
