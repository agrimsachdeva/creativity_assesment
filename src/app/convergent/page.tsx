"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Background } from "../../components/shared/Background";
import { Header } from "../../components/shared/Header";
import { ChatInterface } from "../../components/shared/ChatInterface";
import { SessionInfo } from "../../components/shared/SessionInfo";
import { TaskDescription } from "../../components/shared/TaskDescription";
import { RATDisplay } from "../../components/convergent/RATDisplay";
import { sendChatMessage, logTaskCompletion } from "../../components/shared/api";
import { useTelemetry } from "../../components/shared/useTelemetry";
import { Message } from "../../components/shared/types";
import { RAT_WORD_SETS, RATWordSet } from "../../components/convergent/ratData";

function ConvergentTaskApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [qualtricsId, setQualtricsId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentWordSet, setCurrentWordSet] = useState<RATWordSet | null>(null);
  const [totalRounds, setTotalRounds] = useState(4); // Easily configurable total number of rounds
  const [finalAnswer, setFinalAnswer] = useState("");
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
  } = useTelemetry("convergent");

  useEffect(() => {
    // Extract parameters from URL
    const id = searchParams.get("qualtricsId") || searchParams.get("id");
    if (id) setQualtricsId(id);
    
    // Initialize startTime on client side only
    setStartTime(new Date().toISOString());
    
    // Initialize the first RAT round
    initializeRATRound();

    // Show initial AI help message in chat
    setMessages([
      {
        role: "assistant",
        content: "👋 I'm here to help you with the Remote Associates Test. If you need hints, want to discuss your ideas, or have questions, just type your message below!",
        timestamp: Date.now(),
      },
    ]);
  }, [searchParams]);

  const initializeRATRound = () => {
    // Randomly select a word set for the current round
    const randomIndex = Math.floor(Math.random() * RAT_WORD_SETS.length);
    const selectedWordSet = RAT_WORD_SETS[randomIndex];
    setCurrentWordSet(selectedWordSet);
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

    // Generate telemetry
    const telemetry = generateTelemetry(
      currentRound,
      null,
      taskResponses.length > 0 ? 100 : 0,
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

  const handleSubmitAnswer = () => {
    if (finalAnswer.trim() === "") return;

    if (currentRound < totalRounds) {
      setCurrentRound((prev) => prev + 1);
      initializeRATRound();
    } else {
      setCompleted(true);
    }

    setFinalAnswer("");
  };

  const handleTaskCompletion = async () => {
    setEndTime(new Date().toISOString());

    // Log required fields for debugging
    console.log("Logging task completion data:", {
      subjectId: sessionId,
      transcript,
      taskResponses,
      engagementMetrics,
      startTime,
      endTime,
    });

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
      taskType: "convergent" as const,
      taskProgress: 100,
      currentRound: currentRound,
      currentWordSet: currentWordSet,
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
        wordCount: 0,
        charCount: 0,
        avgWordLength: 0,
        sentenceCount: 0,
        avgSentenceLength: 0,
        vocabularyRichness: 0,
        readabilityScore: 0,
        semanticComplexity: 0,
        emotionalTone: {
          positive: 0,
          negative: 0,
          neutral: 1,
        },
        creativityIndicators: {
          uniqueWords: 0,
          metaphorCount: 0,
          questionCount: 0,
          ideaCount: 0,
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
        "convergent",
        transcript,
        taskResponses,
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
        {/* RAT Test Section */}
        <div className="flex-1 max-w-2xl bg-white/10 rounded-2xl p-4 md:p-6 border border-white/20 shadow-md flex flex-col justify-start min-h-[60vh]">
          <TaskDescription taskType="convergent" />
          <div className="mb-8" />
          {!completed && currentWordSet && (
            <RATDisplay
              currentWordSet={currentWordSet}
              currentRound={currentRound}
              totalRounds={totalRounds}
            />
          )}
          <div className="mt-4">
            {!completed ? (
              <>
                <label htmlFor="finalAnswer" className="block text-white text-base mb-2">
                  Enter your final answer:
                </label>
                <input
                  id="finalAnswer"
                  name="finalAnswer"
                  type="text"
                  value={finalAnswer}
                  onChange={(e) => setFinalAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmitAnswer();
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md text-base mb-2 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  placeholder="Type your answer here..."
                />
                <button
                  onClick={handleSubmitAnswer}
                  className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-base font-semibold transition mt-2 shadow"
                >
                  Submit
                </button>
              </>
            ) : (
              <div className="mt-4 text-green-400 text-lg text-center">🎉 Congratulations! You've completed all rounds of the Remote Associates Test. Thank you for your participation!</div>
            )}
          </div>
          <div className="mt-8">
            <SessionInfo 
              qualtricsId={qualtricsId}
              sessionId={sessionId}
              userId={userId}
            />
          </div>
        </div>

        {/* ChatGPT Section */}
        <div className="flex-1 max-w-2xl flex flex-col bg-white/10 rounded-2xl border border-white/20 shadow-md min-h-[60vh] max-h-[80vh] p-4 md:p-6">
          <div className="flex-1 flex flex-col min-h-0">
            <ChatInterface
              messages={messages}
              input={input}
              loading={loading}
              taskType="convergent"
              onInputChange={setInput}
              onSendMessage={handleSendMessage}
              onStartComposition={handleStartComposition}
              onUpdateContent={handleUpdateContent}
              onCompleteMessage={handleCompleteMessage}
              emptyStateTitle="Ready for the Challenge?"
              emptyStateDescription="Use focused thinking to find the word that connects all three given words. Work systematically through possibilities!"
            />

          </div>
        </div>
      </div>
    </Background>
  );
}

export default function ConvergentPage() {
  return (
    <Suspense fallback={
      <Background>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </Background>
    }>
      <ConvergentTaskApp />
    </Suspense>
  );
}
