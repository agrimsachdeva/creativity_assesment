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
  const [participantId, setParticipantId] = useState<string | null>(null); // Primary ID from Qualtrics URL
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
    engagementMetrics: telemetryEngagement,
    copyPasteEvents,
    aiUsageTracking,
    startMessageComposition,
    updateMessageContent,
    completeMessage,
    recordAiResponse,
    recordResponseLatency,
    recordAiResponseText,
    calculateAiUsageInAnswer,
    getEngagementData,
    generateTelemetry,
    // Help-seeking behavior tracking
    recordAIQuery,
    recordAnswerSubmission,
    recordRoundComplete,
    resetHelpSeekingMetrics,
  } = useTelemetry("divergent");

  useEffect(() => {
    // Extract participant ID from URL - supports multiple parameter names for flexibility
    // Qualtrics can pass: ?participantId=XXX, ?PROLIFIC_PID=XXX, ?id=XXX, or ?qualtricsId=XXX
    const id = searchParams.get("participantId") 
      || searchParams.get("PROLIFIC_PID") 
      || searchParams.get("id") 
      || searchParams.get("qualtricsId")
      || searchParams.get("pid");
    
    if (id) {
      setParticipantId(id);
      console.log("[Telemetry] Participant ID from URL:", id);
    } else {
      console.warn("[Telemetry] No participant ID found in URL. Using session ID as fallback.");
    }
    
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

    // Track AI query for help-seeking behavior
    recordAIQuery();

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
        // Add AI response to transcript
        setTranscript((prev) => [...prev, { role: "assistant", content: response.content, timestamp: Date.now() }]);
        // Track AI response text for usage analysis
        recordAiResponseText(response.content);
      } else {
        console.error("Invalid response format:", response);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setLoading(false);
  };

  const handleComplete = () => {
    // Track help-seeking: was this task AI-assisted?
    const wasAIAssisted = engagementMetrics.chatbotEngagementCount > 0;
    recordAnswerSubmission(wasAIAssisted);
    
    // Track round completion (DAT is single round)
    recordRoundComplete();
    
    setCompleted(true);
  };

  const handleRestart = () => {
    // Reset all state for a fresh start
    setCompleted(false);
    setWords([]);
    setTaskResponses([]);
    setTranscript([]);
    setStartTime(new Date().toISOString());
    // Reset help-seeking metrics
    resetHelpSeekingMetrics();
    setMessages([
      {
        role: "assistant",
        content: "🧠 Welcome back! Ready to explore more diverse words? Try to think of 10 words that are as different from each other as possible!",
        timestamp: Date.now(),
      },
    ]);
  };

  const handleTaskCompletion = async () => {
    // Use participantId from URL if available, otherwise fall back to sessionId
    const subjectId = participantId || sessionId;
    
    // Guard: ensure we have a valid subject ID
    if (!subjectId) {
      console.error("=== TASK COMPLETION ABORTED: No subject ID available ===");
      console.error("participantId:", participantId, "sessionId:", sessionId);
      return;
    }
    
    const currentEndTime = new Date().toISOString();
    setEndTime(currentEndTime);

    // Get complete engagement data including copy/paste and AI usage
    const completeEngagementData = getEngagementData();

    // Log required fields for debugging
    console.log("=== TASK COMPLETION DEBUG ===");
    console.log("subjectId (from URL or session):", subjectId);
    console.log("participantId (from URL):", participantId);
    console.log("sessionId (generated):", sessionId);
    console.log("transcript:", transcript);
    console.log("taskResponses:", taskResponses);
    console.log("engagementMetrics:", completeEngagementData);
    console.log("startTime:", startTime);
    console.log("endTime:", currentEndTime);

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
      // Structure DAT data with prompt and responses for consistency
      const taskData = {
        prompt: "Generate 10 words that are as semantically different from each other as possible",
        responses: words.filter(w => w.trim() !== '')
      };
      
      await logTaskCompletion(
        subjectId, // Use participantId from URL or fallback to sessionId
        "dat",
        transcript,
        taskData, // Pass structured task data with prompt and responses
        completeEngagementData, // Use enhanced engagement data with copy/paste and AI usage
        startTime,
        currentEndTime,
        defaultTelemetry,
        participantId // Pass participantId separately for reference
      );
      console.log("=== TASK COMPLETION SUCCESS ===");
    } catch (error) {
      console.error("=== TASK COMPLETION ERROR ===", error);
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
            <div className="mt-4 text-center">
              <div className="text-green-400 text-lg mb-4">
                🎉 Congratulations! You've completed the Divergent Association Task. Thank you for your creativity!
              </div>
              <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                <p className="text-white/70 text-sm mb-3">
                  Want to try again for fun? You can restart the test below. 
                  <span className="text-yellow-400 font-medium"> Note: This is optional and does not affect your compensation.</span>
                </p>
                <button
                  onClick={handleRestart}
                  className="px-6 py-2 bg-pink-500/80 hover:bg-pink-500 text-white rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  🔄 Restart for Fun
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-8">
            <SessionInfo 
              sessionId={sessionId}
              qualtricsId={participantId}
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
