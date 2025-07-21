"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Background } from "../../components/shared/Background";
import { Header } from "../../components/shared/Header";
import { ChatInterface } from "../../components/shared/ChatInterface";
import { SessionInfo } from "../../components/shared/SessionInfo";
import { TaskDescription } from "../../components/shared/TaskDescription";
import { RATDisplay } from "../../components/convergent/RATDisplay";
import { sendChatMessage } from "../../components/shared/api";
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
  } = useTelemetry("convergent");

  useEffect(() => {
    // Extract parameters from URL
    const id = searchParams.get("qualtricsId") || searchParams.get("id");
    if (id) setQualtricsId(id);
    
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

    // Generate comprehensive telemetry
    const telemetry = generateTelemetry(
      currentRound,
      currentWordSet,
      100, // Task progress is always 100% in this version
      completed,
      input
    );

    const currentInput = input;
    setInput("");

    try {
      const startTime = Date.now();
      recordResponseLatency();

      const aiMessage = await sendChatMessage(
        [...messages, userMessage], 
        "convergent", 
        telemetry!, 
        qualtricsId
      );

      const responseTime = Date.now() - startTime;
      recordAiResponse(responseTime);

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      // Provide specific error messages based on the error
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
        <div className="flex-1 max-w-2xl flex flex-col bg-white/10 rounded-2xl border border-white/20 shadow-md min-h-[60vh] max-h-[80vh] p-4 md:p-6 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-auto custom-scrollbar">
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
