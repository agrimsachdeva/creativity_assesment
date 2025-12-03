"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Background } from "../../components/shared/Background";
import { Header } from "../../components/shared/Header";
import { ChatInterface } from "../../components/shared/ChatInterface";
import { SessionInfo } from "../../components/shared/SessionInfo";
import { TaskDescription } from "../../components/shared/TaskDescription";
import { AUTDisplay } from "../../components/divergent/AUTDisplay";
import { sendChatMessage, logTaskCompletion } from "../../components/shared/api";
import { useTelemetry } from "../../components/shared/useTelemetry";
import { Message } from "../../components/shared/types";
import { AUT_ITEMS, AUTItem, getRandomAUTItem } from "../../components/divergent/autData";

function DivergentTaskApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null); // Primary ID from Qualtrics URL
  const [currentRound, setCurrentRound] = useState(1);
  const [currentItem, setCurrentItem] = useState<AUTItem | null>(null);
  const [totalRounds, setTotalRounds] = useState(3); // Total number of rounds
  const [ideas, setIdeas] = useState<string[]>([]);
  const [newIdea, setNewIdea] = useState("");
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
    generateTelemetry
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
    
    // Initialize the first AUT round
    initializeAUTRound();

    // Show initial AI help message in chat
    setMessages([
      {
        role: "assistant",
        content: "🎨 Welcome to the Alternate Uses Test! I'm here to help spark your creativity. Share your wildest ideas for unusual uses of everyday objects. Need inspiration or want to brainstorm together? Just type below!",
        timestamp: Date.now(),
      },
    ]);
  }, [searchParams]);

  const initializeAUTRound = () => {
    // Use helper function for random selection
    const selectedItem = getRandomAUTItem();
    setCurrentItem(selectedItem);
    setIdeas([]); // Reset ideas for new round
  };

  const handleAddIdea = (idea: string) => {
    setIdeas(prev => [...prev, idea]);
    // Track how much of this idea came from AI suggestions
    calculateAiUsageInAnswer(idea);
    // Update task responses for database
    setTaskResponses(prev => [...prev, idea]);
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
      currentRound,
      null,
      ideas.length > 0 ? 100 : 0,
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

  const handleNextRound = () => {
    if (currentRound < totalRounds) {
      setCurrentRound((prev) => prev + 1);
      initializeAUTRound();
    } else {
      setCompleted(true);
    }
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
    
    const currentEndTime = new Date().toISOString(); // Use local variable instead of state
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
      currentRound: currentRound,
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
      sessionDuration: new Date(currentEndTime).getTime() - new Date(startTime).getTime(),
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
        subjectId, // Use participantId from URL or fallback to sessionId
        "aut",
        transcript,
        taskResponses,
        completeEngagementData, // Use enhanced engagement data
        startTime,
        currentEndTime, // Use local variable, not state
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
        {/* AUT Test Section */}
        <div className="flex-1 max-w-2xl bg-white/10 rounded-2xl p-4 md:p-6 border border-white/20 shadow-md flex flex-col justify-start min-h-[60vh]">
          <TaskDescription taskType="divergent" />
          <div className="mb-8" />
          {!completed && currentItem && (
            <AUTDisplay
              currentItem={currentItem}
              currentRound={currentRound}
              totalRounds={totalRounds}
              ideas={ideas}
              onAddIdea={handleAddIdea}
              newIdea={newIdea}
              onNewIdeaChange={setNewIdea}
            />
          )}
          <div className="mt-4">
            {!completed ? (
              <>
                {ideas.length >= 3 && (
                  <button
                    onClick={handleNextRound}
                    className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 text-base font-semibold transition mt-2 shadow"
                  >
                    {currentRound < totalRounds ? `Continue to Round ${currentRound + 1}` : "Complete Test"}
                  </button>
                )}
                {ideas.length < 3 && (
                  <p className="text-white/60 text-sm text-center mt-2">
                    💡 Add at least 3 creative ideas to continue to the next round
                  </p>
                )}
              </>
            ) : (
              <div className="mt-4 text-green-400 text-lg text-center">🎉 Congratulations! You've completed all rounds of the Alternate Uses Test. Thank you for your creativity!</div>
            )}
          </div>
          <div className="mt-8">
            <SessionInfo 
              qualtricsId={participantId}
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
              taskType="divergent"
              onInputChange={setInput}
              onSendMessage={handleSendMessage}
              onStartComposition={handleStartComposition}
              onUpdateContent={handleUpdateContent}
              onCompleteMessage={handleCompleteMessage}
              emptyStateTitle="Ready to Unleash Your Creativity?"
              emptyStateDescription="Let your imagination soar! Generate multiple unique ideas, explore unconventional solutions, and think beyond boundaries."
            />

          </div>
        </div>
      </div>
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
