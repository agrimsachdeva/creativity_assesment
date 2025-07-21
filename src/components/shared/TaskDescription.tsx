import React from "react";

interface TaskDescriptionProps {
  taskType: "divergent" | "convergent";
}

export function TaskDescription({ taskType }: TaskDescriptionProps) {
  return (
    <div className="backdrop-blur-sm bg-white/10 rounded-3xl p-6 border border-white/20 shadow-2xl">
      <div className="flex items-center mb-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 ${
          taskType === "divergent" 
            ? "bg-gradient-to-r from-purple-500 to-pink-500" 
            : "bg-gradient-to-r from-blue-500 to-cyan-500"
        }`}>
          {taskType === "divergent" ? "🌟" : "🎯"}
        </div>
        <h3 className="text-xl font-bold text-white">
          {taskType === "divergent" ? "Divergent Thinking" : "Remote Associates Test (RAT)"}
        </h3>
      </div>
      <p className="text-white/80 leading-snug text-md">
        {taskType === "divergent" 
          ? "Unleash your creativity! Generate unique ideas and explore unconventional solutions. No wrong answers—let your imagination soar!"
          : "Task: You'll be given 3 words and need to find a fourth word that connects all three. Use the AI assistant to brainstorm and discuss possibilities."
        }
      </p>
    </div>
  );
}
