import React from "react";
import { AUTItem } from "./autData";

interface AUTDisplayProps {
  currentItem: AUTItem;
  currentRound: number;
  totalRounds: number;
  ideas: string[];
  onAddIdea: (idea: string) => void;
  newIdea: string;
  onNewIdeaChange: (idea: string) => void;
}

export function AUTDisplay({
  currentItem,
  currentRound,
  totalRounds,
  ideas,
  onAddIdea,
  newIdea,
  onNewIdeaChange
}: AUTDisplayProps) {
  const handleAddIdea = () => {
    if (newIdea.trim()) {
      onAddIdea(newIdea.trim());
      onNewIdeaChange("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddIdea();
    }
  };

  return (
    <div className="space-y-6">
      {/* Round Indicator */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-bold text-xl mb-3">
          {currentRound}/{totalRounds}
        </div>
        <p className="text-white/80 text-sm">Round {currentRound} of {totalRounds}</p>
      </div>

      {/* Current Item Display */}
      <div className="text-center bg-white/5 rounded-2xl p-6 border border-white/20">
        <div className="text-6xl mb-4">{currentItem.emoji}</div>
        <h2 className="text-3xl font-bold text-white mb-2">{currentItem.name}</h2>
        <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-white/60 text-sm mb-3 capitalize">
          {currentItem.category}
        </div>
        <p className="text-white/70 text-lg">{currentItem.description}</p>
        <div className="mt-4 p-4 bg-purple-500/20 rounded-xl border border-purple-300/30">
          <p className="text-purple-200 font-semibold">
            💡 Think of creative, unusual, and innovative uses beyond its normal purpose!
          </p>
        </div>
      </div>

      {/* Ideas Input Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            id="idea-input"
            name="newIdea"
            type="text" 
            value={newIdea}
            onChange={(e) => onNewIdeaChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Enter a creative use for the ${currentItem.name.toLowerCase()}...`}
            className="flex-1 p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
          />
          <button
            onClick={handleAddIdea}
            disabled={!newIdea.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Add Idea
          </button>
        </div>
      </div>

      {/* Ideas List */}
      {ideas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-lg flex items-center">
            💡 Your Creative Ideas ({ideas.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {ideas.map((idea, index) => (
              <div
                key={index}
                className="p-3 bg-white/5 rounded-lg border border-white/10 text-white/90 hover:bg-white/10 transition-colors duration-200"
              >
                <span className="text-purple-300 font-semibold mr-2">{index + 1}.</span>
                {idea}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
