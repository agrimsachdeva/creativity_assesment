import { Message, Telemetry } from "./types";
import { TelemetryCollector } from "./telemetryCollector";

// Function for regular chat messages
export async function sendChatMessage(
  messages: Message[]
): Promise<Message> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      messages
    }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
  }
  
  const data = await res.json();
  if (!data.response) {
    throw new Error("Invalid response format from server");
  }
  
  return { ...data.response, role: "assistant" };
}

// Function for task completion logging
export async function logTaskCompletion(
  subjectId: string,
  taskType: "divergent" | "convergent",
  transcript: any,
  taskResponses: any,
  engagementMetrics: any,
  startTime: string,
  endTime: string,
  telemetry?: Telemetry,
  qualtricsId?: string | null
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      subjectId,
      taskType, 
      transcript,
      taskResponses,
      engagementMetrics,
      startTime,
      endTime,
      telemetry, 
      qualtricsId
    }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
  }
}

// Legacy function for backward compatibility
export function createTelemetry(
  taskType: "divergent" | "convergent",
  currentRound?: number | null,
  currentWordSet?: { words: string[]; answer: string } | null
): Telemetry {
  // Only use browser APIs and non-deterministic values on the client
  if (typeof window !== "undefined" && typeof navigator !== "undefined") {
    return {
      sessionId: `session_${Date.now()}`,
      userId: `user_${Date.now()}`,
      timestamp: Date.now(),
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      devicePixelRatio: window.devicePixelRatio,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      taskType,
      currentRound: taskType === "convergent" ? currentRound : null,
      currentWordSet: taskType === "convergent" ? currentWordSet : null,
      taskProgress: 0,
      typingPattern: {
        totalKeypresses: 0,
        backspaceCount: 0,
        pauseCount: 0,
        avgTypingSpeed: 0,
        peakTypingSpeed: 0,
        keystrokeDynamics: { dwellTimes: [], flightTimes: [], rhythm: 0 },
        correctionRatio: 0,
        pauseDistribution: []
      },
      mouseActivity: [],
      keystrokeSequence: [],
      cognitiveLoad: {
        thinkingPauses: 0,
        avgThinkingTime: 0,
        longestPause: 0,
        editingBehavior: { revisions: 0, deletions: 0, insertions: 0, cursorMovements: 0 },
        responseLatency: 0,
        taskSwitching: 0
      },
      linguisticFeatures: {
        wordCount: 0,
        charCount: 0,
        avgWordLength: 0,
        sentenceCount: 0,
        avgSentenceLength: 0,
        vocabularyRichness: 0,
        readabilityScore: 0,
        semanticComplexity: 0,
        emotionalTone: { positive: 0, negative: 0, neutral: 1 },
        creativityIndicators: { uniqueWords: 0, metaphorCount: 0, questionCount: 0, ideaCount: 0 }
      },
      messageMetrics: {
        responseTime: 0,
        messageLength: 0,
        editCount: 0,
        finalMessageDifferentFromFirst: false
      },
      interactionSequence: [],
      sessionDuration: 0,
      totalMessages: 0,
      avgMessageInterval: 0,
      taskCompletion: false,
      featureVector: [],
      temporalFeatures: []
    };
  } else {
    // SSR: return placeholder values to avoid hydration mismatch
    return {
      sessionId: 'session_placeholder',
      userId: 'user_placeholder',
      timestamp: 0,
      language: 'en',
      platform: 'unknown',
      userAgent: '',
      screenResolution: '0x0',
      viewport: '0x0',
      timezone: 'UTC',
      devicePixelRatio: 1,
      connectionType: 'unknown',
      taskType,
      currentRound: taskType === "convergent" ? currentRound : null,
      currentWordSet: taskType === "convergent" ? currentWordSet : null,
      taskProgress: 0,
      typingPattern: {
        totalKeypresses: 0,
        backspaceCount: 0,
        pauseCount: 0,
        avgTypingSpeed: 0,
        peakTypingSpeed: 0,
        keystrokeDynamics: { dwellTimes: [], flightTimes: [], rhythm: 0 },
        correctionRatio: 0,
        pauseDistribution: []
      },
      mouseActivity: [],
      keystrokeSequence: [],
      cognitiveLoad: {
        thinkingPauses: 0,
        avgThinkingTime: 0,
        longestPause: 0,
        editingBehavior: { revisions: 0, deletions: 0, insertions: 0, cursorMovements: 0 },
        responseLatency: 0,
        taskSwitching: 0
      },
      linguisticFeatures: {
        wordCount: 0,
        charCount: 0,
        avgWordLength: 0,
        sentenceCount: 0,
        avgSentenceLength: 0,
        vocabularyRichness: 0,
        readabilityScore: 0,
        semanticComplexity: 0,
        emotionalTone: { positive: 0, negative: 0, neutral: 1 },
        creativityIndicators: { uniqueWords: 0, metaphorCount: 0, questionCount: 0, ideaCount: 0 }
      },
      messageMetrics: {
        responseTime: 0,
        messageLength: 0,
        editCount: 0,
        finalMessageDifferentFromFirst: false
      },
      interactionSequence: [],
      sessionDuration: 0,
      totalMessages: 0,
      avgMessageInterval: 0,
      taskCompletion: false,
      featureVector: [],
      temporalFeatures: []
    };
  }
}

// Utility functions for telemetry management
export function createTelemetryCollector(
  sessionId: string,
  userId: string,
  taskType: "divergent" | "convergent"
): TelemetryCollector {
  return new TelemetryCollector(sessionId, userId, taskType);
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateUserId(): string {
  // Only access localStorage if running in the browser
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    let userId = localStorage.getItem('creativity_user_id');
    if (!userId) {
      userId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('creativity_user_id', userId);
    }
    return userId;
  } else {
    // Fallback for SSR: generate a temporary userId
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
}
