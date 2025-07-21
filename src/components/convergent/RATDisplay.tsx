import React from "react";
import { RATWordSet } from "./ratData";

interface RATDisplayProps {
  currentWordSet: RATWordSet;
  currentRound: number;
  totalRounds: number;
}

export function RATDisplay({ currentWordSet, currentRound, totalRounds }: RATDisplayProps) {
  return (
    <div className="mb-8 backdrop-blur-sm bg-white/10 rounded-3xl p-6 border border-white/20 shadow-xl">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-4">
          Remote Associates Test - Round {currentRound}/{totalRounds}
        </h3>
        <div className="flex justify-center space-x-4 mb-4">
          {currentWordSet.words.map((word, index) => (
            <div key={index} className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 rounded-xl text-white font-bold text-lg shadow-lg">
              {word}
            </div>
          ))}
        </div>
        <p className="text-white/80 text-sm mb-4">
          Find a word that connects or relates to all three words above
        </p>
      </div>
    </div>
  );
}
