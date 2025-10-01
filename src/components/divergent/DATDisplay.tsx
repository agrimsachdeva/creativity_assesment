import React, { useState } from "react";
import { DAT_TASK, validateDATWord, checkWordSimilarity } from "./datData";

interface DATDisplayProps {
  onWordsChange: (words: string[]) => void;
  onComplete: () => void;
  completed: boolean;
}

export function DATDisplay({ onWordsChange, onComplete, completed }: DATDisplayProps) {
  const [words, setWords] = useState<string[]>(Array(10).fill(""));
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>(Array(10).fill(""));
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    const newErrors = [...validationErrors];
    
    newWords[index] = value;
    
    // Validate the word
    const validation = validateDATWord(value);
    newErrors[index] = validation.valid ? "" : (validation.error || "");
    
    setWords(newWords);
    setValidationErrors(newErrors);
    
    // Check for warnings across all words
    const filledWords = newWords.filter(w => w.trim() !== "");
    if (filledWords.length > 1) {
      const newWarnings = checkWordSimilarity(filledWords);
      setWarnings(newWarnings);
    } else {
      setWarnings([]);
    }
    
    // Notify parent component
    onWordsChange(newWords);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" && index < 9) {
      setCurrentWordIndex(index + 1);
      // Focus next input
      setTimeout(() => {
        const nextInput = document.getElementById(`dat-word-${index + 1}`);
        nextInput?.focus();
      }, 0);
    }
  };

  const isComplete = words.every(word => word.trim() !== "") && validationErrors.every(error => error === "");
  const filledWordsCount = words.filter(word => word.trim() !== "").length;

  return (
    <div className="space-y-6">
      {/* Task Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          🧠 Divergent Association Task
        </h2>
        <div className="bg-white/10 rounded-lg p-4 text-left">
          <h3 className="text-lg font-semibold text-white mb-2">Instructions</h3>
          <p className="text-white/90 mb-4">{DAT_TASK.instructions}</p>
          
          <h3 className="text-lg font-semibold text-white mb-2">Rules</h3>
          <ul className="space-y-1 text-white/90 text-sm">
            {DAT_TASK.rules.map((rule, index) => (
              <li key={index} className="flex items-start">
                <span className="text-cyan-400 mr-2">•</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Progress */}
      <div className="text-center">
        <div className="text-white/80 text-sm mb-2">
          Progress: {filledWordsCount}/10 words
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full h-2 transition-all duration-300"
            style={{ width: `${(filledWordsCount / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Word Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {words.map((word, index) => (
          <div key={index} className="space-y-2">
            <label 
              htmlFor={`dat-word-${index}`}
              className="block text-white font-medium text-sm"
            >
              Word {index + 1}
            </label>
            <input
              id={`dat-word-${index}`}
              type="text"
              value={word}
              onChange={(e) => handleWordChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setCurrentWordIndex(index)}
              className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                validationErrors[index] 
                  ? "border-red-400 bg-red-50 text-red-900" 
                  : word.trim() 
                    ? "border-green-400 bg-green-50 text-green-900"
                    : "border-white/30 bg-white/10 text-white"
              } focus:outline-none focus:ring-2 focus:ring-cyan-400`}
              placeholder={`Enter word ${index + 1}...`}
              disabled={completed}
            />
            {validationErrors[index] && (
              <p className="text-red-400 text-xs">{validationErrors[index]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4">
          <h4 className="text-yellow-300 font-semibold mb-2">⚠️ Suggestions</h4>
          <ul className="space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="text-yellow-200 text-sm">• {warning}</li>
            ))}
          </ul>
          <p className="text-yellow-200 text-xs mt-2">
            For better creativity scores, try to choose words that are as different as possible from each other.
          </p>
        </div>
      )}

      {/* Examples */}
      {DAT_TASK.examples && (
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">💡 Examples</h4>
          <div className="space-y-2">
            <div>
              <span className="text-green-400 text-sm font-medium">Good example: </span>
              <span className="text-white/80 text-sm">
                {DAT_TASK.examples.good.slice(0, 5).join(", ")}...
              </span>
            </div>
            <div>
              <span className="text-red-400 text-sm font-medium">Avoid: </span>
              <span className="text-white/80 text-sm">
                {DAT_TASK.examples.bad.join(", ")} (too similar)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Complete Button */}
      {isComplete && !completed && (
        <div className="text-center">
          <button
            onClick={onComplete}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            Complete Task ✨
          </button>
        </div>
      )}

      {completed && (
        <div className="text-center">
          <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-4">
            <h4 className="text-green-300 font-semibold mb-2">🎉 Task Completed!</h4>
            <p className="text-green-200 text-sm">
              Great job! You've successfully entered 10 diverse words. 
              Your responses have been recorded for analysis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
