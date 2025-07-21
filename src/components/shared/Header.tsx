import React from "react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  taskType: "divergent" | "convergent";
}

export function Header({ title = "Creativity Lab", subtitle = "Unlock your creative potential through AI-powered conversations", taskType }: HeaderProps) {
  return (
    <div className="text-center mb-8 backdrop-blur-sm bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
      <div className="flex items-center justify-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mr-4">
          <span className="text-2xl">🧠</span>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          {title}
        </h1>
      </div>
      <p className="text-white/80 text-xl font-light">
        {subtitle}
      </p>
    </div>
  );
}
