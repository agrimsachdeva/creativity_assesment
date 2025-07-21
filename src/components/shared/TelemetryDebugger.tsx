import React, { useState } from "react";
import { AdvancedTelemetry } from "./types";

interface TelemetryDebuggerProps {
  telemetry: AdvancedTelemetry | null;
  isVisible?: boolean;
}

export function TelemetryDebugger({ telemetry, isVisible = false }: TelemetryDebuggerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!isVisible || !telemetry) return null;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatNumber = (num: number) => {
    return num.toFixed(2);
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      <div className="backdrop-blur-lg bg-black/20 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-600/30 to-purple-600/30 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white font-semibold text-sm">Telemetry Debug</span>
          </div>
          <span className="text-white/60 text-xs">
            {expanded ? "▼" : "▶"}
          </span>
        </div>

        {/* Content */}
        {expanded && (
          <div className="p-4 max-h-96 overflow-y-auto text-xs">
            {/* Basic Info */}
            <div className="mb-4">
              <h4 className="text-cyan-300 font-semibold mb-2">Session Info</h4>
              <div className="space-y-1 text-white/80">
                <div>Session: {telemetry.sessionId.slice(-8)}</div>
                <div>User: {telemetry.userId.slice(-6)}</div>
                <div>Task: {telemetry.taskType}</div>
                <div>Duration: {formatDuration(telemetry.sessionDuration)}</div>
                <div>Progress: {telemetry.taskProgress}%</div>
              </div>
            </div>

            {/* Typing Metrics */}
            <div className="mb-4">
              <h4 className="text-purple-300 font-semibold mb-2">Typing Pattern</h4>
              <div className="space-y-1 text-white/80">
                <div>Keystrokes: {telemetry.typingPattern.totalKeypresses}</div>
                <div>Backspaces: {telemetry.typingPattern.backspaceCount}</div>
                <div>Pauses: {telemetry.typingPattern.pauseCount}</div>
                <div>Avg Speed: {formatNumber(telemetry.typingPattern.avgTypingSpeed)} cpm</div>
                <div>Peak Speed: {formatNumber(telemetry.typingPattern.peakTypingSpeed)} cpm</div>
                <div>Correction Ratio: {formatNumber(telemetry.typingPattern.correctionRatio * 100)}%</div>
              </div>
            </div>

            {/* Cognitive Load */}
            <div className="mb-4">
              <h4 className="text-pink-300 font-semibold mb-2">Cognitive Load</h4>
              <div className="space-y-1 text-white/80">
                <div>Thinking Pauses: {telemetry.cognitiveLoad.thinkingPauses}</div>
                <div>Avg Think Time: {formatDuration(telemetry.cognitiveLoad.avgThinkingTime)}</div>
                <div>Longest Pause: {formatDuration(telemetry.cognitiveLoad.longestPause)}</div>
                <div>Response Latency: {formatDuration(telemetry.cognitiveLoad.responseLatency)}</div>
                <div>Task Switches: {telemetry.cognitiveLoad.taskSwitching}</div>
                <div>Revisions: {telemetry.cognitiveLoad.editingBehavior.revisions}</div>
              </div>
            </div>

            {/* Linguistic Features */}
            <div className="mb-4">
              <h4 className="text-yellow-300 font-semibold mb-2">Content Analysis</h4>
              <div className="space-y-1 text-white/80">
                <div>Words: {telemetry.linguisticFeatures.wordCount}</div>
                <div>Chars: {telemetry.linguisticFeatures.charCount}</div>
                <div>Vocab Richness: {formatNumber(telemetry.linguisticFeatures.vocabularyRichness * 100)}%</div>
                <div>Readability: {formatNumber(telemetry.linguisticFeatures.readabilityScore)}</div>
                <div>Creativity: {telemetry.linguisticFeatures.creativityIndicators.uniqueWords} unique</div>
                <div>Questions: {telemetry.linguisticFeatures.creativityIndicators.questionCount}</div>
              </div>
            </div>

            {/* Interaction Data */}
            <div className="mb-4">
              <h4 className="text-green-300 font-semibold mb-2">Interaction Stats</h4>
              <div className="space-y-1 text-white/80">
                <div>Messages: {telemetry.totalMessages}</div>
                <div>Mouse Events: {telemetry.mouseActivity.length}</div>
                <div>Keystrokes: {telemetry.keystrokeSequence.length}</div>
                <div>Interactions: {telemetry.interactionSequence.length}</div>
                <div>Focus Events: {telemetry.attentionTracking?.focusEvents.length || 0}</div>
              </div>
            </div>

            {/* Feature Vector Preview */}
            <div className="mb-4">
              <h4 className="text-orange-300 font-semibold mb-2">ML Features</h4>
              <div className="space-y-1 text-white/80">
                <div>Feature Vector: [{telemetry.featureVector.slice(0, 3).map(f => formatNumber(f)).join(", ")}...]</div>
                <div>Temporal Features: {telemetry.temporalFeatures.length} windows</div>
              </div>
            </div>

            {/* Quality Metrics */}
            {telemetry.qualityMetrics && (
              <div>
                <h4 className="text-red-300 font-semibold mb-2">Quality Scores</h4>
                <div className="space-y-1 text-white/80">
                  <div>Relevance: {formatNumber(telemetry.qualityMetrics.relevanceScore * 100)}%</div>
                  <div>Creativity: {formatNumber(telemetry.qualityMetrics.creativityScore * 100)}%</div>
                  <div>Coherence: {formatNumber(telemetry.qualityMetrics.coherenceScore * 100)}%</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
