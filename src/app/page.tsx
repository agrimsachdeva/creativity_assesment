"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

function CreativityApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [taskType, setTaskType] = useState<string>("divergent");
  const [qualtricsId, setQualtricsId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract parameters from URL using useSearchParams
    const id = searchParams.get("qualtricsId") || searchParams.get("id");
    const type = searchParams.get("taskType") || searchParams.get("type");
    
    if (id) setQualtricsId(id);
    if (type && (type === "divergent" || type === "convergent")) {
      setTaskType(type);
    }
  }, [searchParams]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const userMessage: Message = { role: "user", content: input, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    
    const telemetry = {
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      time: Date.now(),
    };
    
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMessage], 
          taskType, 
          telemetry, 
          qualtricsId 
        }),
      });
      const data = await res.json();
      const aiMessage: Message = { ...data.response, role: "assistant" };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header with glassmorphism */}
        <div className="text-center mb-8 backdrop-blur-sm bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mr-4">
              <span className="text-2xl">🧠</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Creativity Lab
            </h1>
          </div>
          <p className="text-white/80 text-xl font-light">
            Unlock your creative potential through AI-powered conversations
          </p>
        </div>

        {/* Task Type Display with enhanced styling */}
        <div className="flex justify-center mb-8">
          <div className={`relative px-8 py-4 rounded-full font-bold text-white shadow-2xl transform hover:scale-105 transition-all duration-300 ${
            taskType === "divergent" 
              ? "bg-gradient-to-r from-purple-600 via-pink-600 to-red-600" 
              : "bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600"
          }`}>
            <div className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-sm"></div>
            <div className="relative flex items-center space-x-3">
              <span className="text-2xl">
                {taskType === "divergent" ? "🌟" : "🎯"}
              </span>
              <span className="text-lg">
                {taskType === "divergent" ? "Divergent Thinking Mode" : "Convergent Thinking Mode"}
              </span>
            </div>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="backdrop-blur-lg bg-white/10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Chat Messages Area */}
          <div className="h-[500px] overflow-y-auto p-8 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="text-center text-white/80 mt-20">
                <div className="text-8xl mb-6 animate-pulse">💭</div>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Ready to Explore Your Creativity?
                </h3>
                <p className="text-lg mb-6">
                  {taskType === "divergent" 
                    ? "Let your imagination run wild! Generate multiple ideas, think outside the box, and explore endless possibilities."
                    : "Focus your mind like a laser! Find the optimal solution through logical analysis and systematic thinking."
                  }
                </p>
                <div className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-white font-semibold animate-bounce">
                  Start your journey below ⬇️
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                    <div className={`max-w-md lg:max-w-lg relative group ${
                      msg.role === "user" ? "order-2" : "order-1"
                    }`}>
                      {/* Avatar */}
                      <div className={`absolute ${msg.role === "user" ? "-right-12" : "-left-12"} top-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500"
                          : "bg-gradient-to-r from-cyan-500 to-blue-500"
                      }`}>
                        {msg.role === "user" ? "👤" : "🤖"}
                      </div>
                      
                      {/* Message Bubble */}
                      <div className={`px-6 py-4 rounded-2xl backdrop-blur-sm border shadow-xl transition-all duration-300 group-hover:shadow-2xl ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-purple-600/80 to-pink-600/80 border-purple-400/30 text-white ml-6"
                          : "bg-white/20 border-white/30 text-white mr-6"
                      }`}>
                        <div className={`text-xs font-semibold mb-2 ${
                          msg.role === "user" ? "text-purple-200" : "text-cyan-300"
                        }`}>
                          {msg.role === "user" ? "You" : "AI Assistant"}
                        </div>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <div className={`text-xs mt-3 ${
                          msg.role === "user" ? "text-purple-200" : "text-white/60"
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {loading && (
              <div className="flex justify-start mt-6 animate-fade-in">
                <div className="relative">
                  <div className="absolute -left-12 top-0 w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg">
                    🤖
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-4 shadow-xl mr-6">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-white/80 text-sm">AI is crafting a response...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white/5 backdrop-blur-sm border-t border-white/10">
            <div className="flex space-x-4 items-end">
              <div className="flex-1 relative">
                <textarea
                  className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none transition-all duration-300"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={`Share your ${taskType === "divergent" ? "wildest ideas" : "focused thoughts"}... (Press Enter to send)`}
                  disabled={loading}
                  rows={3}
                />
              </div>
              <button
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
              >
                <span>Send</span>
                <span className="text-lg">🚀</span>
              </button>
            </div>
          </div>
        </div>

        {/* Session Info */}
        {qualtricsId && (
          <div className="mt-8 text-center">
            <div className="inline-block backdrop-blur-sm bg-white/10 px-6 py-3 rounded-2xl border border-white/20 shadow-lg">
              <span className="text-white/80 text-sm">
                Session ID: <span className="font-mono font-bold text-cyan-300">{qualtricsId}</span>
              </span>
            </div>
          </div>
        )}

        {/* Enhanced Task Description */}
        <div className="mt-8 backdrop-blur-sm bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
              taskType === "divergent" 
                ? "bg-gradient-to-r from-purple-500 to-pink-500" 
                : "bg-gradient-to-r from-blue-500 to-cyan-500"
            }`}>
              {taskType === "divergent" ? "🌟" : "🎯"}
            </div>
            <h3 className="text-2xl font-bold text-white">
              {taskType === "divergent" ? "Divergent Thinking" : "Convergent Thinking"}
            </h3>
          </div>
          <p className="text-white/80 leading-relaxed">
            {taskType === "divergent" 
              ? "🎨 Unleash your creativity! Generate multiple unique ideas, explore unconventional solutions, and think beyond boundaries. There are no wrong answers - let your imagination soar and discover new possibilities!"
              : "🔍 Channel your analytical power! Focus on finding the most logical, efficient, and correct solution. Use systematic thinking to converge on the optimal answer through careful analysis."
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <CreativityApp />
    </Suspense>
  );
}
