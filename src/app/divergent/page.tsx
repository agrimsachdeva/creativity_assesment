"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Background } from "../../components/shared/Background";
import { Header } from "../../components/shared/Header";
import { ChatInterface } from "../../components/shared/ChatInterface";
import { SessionInfo } from "../../components/shared/SessionInfo";
import { TaskDescription } from "../../components/shared/TaskDescription";
import { AUTDisplay } from "../../components/divergent/AUTDisplay";
import { sendChatMessage } from "../../components/shared/api";
import { useTelemetry } from "../../components/shared/useTelemetry";
import { Message } from "../../components/shared/types";
import { AUT_ITEMS, AUTItem, getRandomAUTItem } from "../../components/divergent/autData";

function DivergentTaskApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [qualtricsId, setQualtricsId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentItem, setCurrentItem] = useState<AUTItem | null>(null);
  const [totalRounds, setTotalRounds] = useState(3); // Easily configurable total number of rounds
  const [ideas, setIdeas] = useState<string[]>([]);
  const [newIdea, setNewIdea] = useState("");
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
  } = useTelemetry("divergent");

  useEffect(() => {
    // Extract parameters from URL
    const id = searchParams.get("qualtricsId") || searchParams.get("id");
    if (id) setQualtricsId(id);
    
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
      null, // AUT doesn't use word sets like RAT
      ideas.length > 0 ? 100 : 0, // Progress based on whether ideas have been added
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
        "divergent", 
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

  const handleNextRound = () => {
    if (currentRound < totalRounds) {
      setCurrentRound((prev) => prev + 1);
      initializeAUTRound();
    } else {
      setCompleted(true);
    }
  };

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
