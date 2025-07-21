"use client";
import React, { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Background } from "../components/shared/Background";
import { ConfigStatus } from "../components/shared/ConfigStatus";

function RouterApp() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Extract parameters from URL
    const id = searchParams.get("qualtricsId") || searchParams.get("id");
    const type = searchParams.get("taskType") || searchParams.get("type");
    
    // Build query string for the redirect
    const params = new URLSearchParams();
    if (id) params.set("qualtricsId", id);
    
    // Redirect to appropriate task page
    if (type === "convergent") {
      router.push(`/convergent?${params.toString()}`);
    } else if (type === "divergent") {
      router.push(`/divergent?${params.toString()}`);
    }
    // If no taskType is specified, stay on this page to show task selection
  }, [searchParams, router]);

  const handleTaskSelection = (taskType: "divergent" | "convergent") => {
    const id = searchParams.get("qualtricsId") || searchParams.get("id");
    const params = new URLSearchParams();
    if (id) params.set("qualtricsId", id);
    
    router.push(`/${taskType}?${params.toString()}`);
  };

  return (
    <Background>
      {/* Header */}
      <div className="text-center mb-12 backdrop-blur-sm bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mr-4">
            <span className="text-2xl">🧠</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Creativity Lab
          </h1>
        </div>
        <p className="text-white/80 text-xl font-light">
          Choose your creativity assessment task
        </p>
      </div>

      {/* Task Selection */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Divergent Thinking Card */}
        <div 
          className="backdrop-blur-sm bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer transform hover:scale-105"
          onClick={() => handleTaskSelection("divergent")}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🌟</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Divergent Thinking</h2>
            <p className="text-white/80 text-lg leading-relaxed mb-6">
              🎨 Unleash your creativity! Generate multiple unique ideas, explore unconventional solutions, and think beyond boundaries. Perfect for brainstorming and creative exploration.
            </p>
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-200">
              Start Divergent Task →
            </div>
          </div>
        </div>

        {/* Convergent Thinking (RAT) Card */}
        <div 
          className="backdrop-blur-sm bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer transform hover:scale-105"
          onClick={() => handleTaskSelection("convergent")}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🎯</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Remote Associates Test</h2>
            <p className="text-white/80 text-lg leading-relaxed mb-6">
              🎯 Test your convergent thinking! Find the connecting word that relates to three given words. Features 2 rounds with research-based word sets from creativity literature.
            </p>
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-200">
              Start RAT Test →
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="backdrop-blur-sm bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-4 text-center">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-4xl mb-3">📝</div>
            <h4 className="text-lg font-semibold text-white mb-2">Choose Task</h4>
            <p className="text-white/70 text-sm">Select either divergent thinking for open-ended creativity or RAT for focused problem-solving</p>
          </div>
          <div>
            <div className="text-4xl mb-3">💬</div>
            <h4 className="text-lg font-semibold text-white mb-2">Chat with AI</h4>
            <p className="text-white/70 text-sm">Interact with ChatGPT to explore ideas, discuss solutions, and enhance your creative process</p>
          </div>
          <div>
            <div className="text-4xl mb-3">📊</div>
            <h4 className="text-lg font-semibold text-white mb-2">Data Collection</h4>
            <p className="text-white/70 text-sm">All interactions and behaviors are captured for research analysis while maintaining privacy</p>
          </div>
        </div>
      </div>

      {/* Configuration Status */}
      <ConfigStatus className="mt-8" />
    </Background>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <Background>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </Background>
    }>
      <RouterApp />
    </Suspense>
  );
}
