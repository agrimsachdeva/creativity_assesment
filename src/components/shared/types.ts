export type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export type KeystrokeEvent = {
  key: string;
  timestamp: number;
  type: 'keydown' | 'keyup';
  duration?: number; // time key was held
  isBackspace: boolean;
  isSpecialKey: boolean;
};

export type MouseEvent = {
  x: number;
  y: number;
  timestamp: number;
  type: 'move' | 'click' | 'scroll';
  element?: string; // CSS selector of target element
  velocity?: number; // for movement events
};

export type TypingPattern = {
  totalKeypresses: number;
  backspaceCount: number;
  pauseCount: number; // pauses > 500ms
  avgTypingSpeed: number; // chars per minute
  peakTypingSpeed: number;
  keystrokeDynamics: {
    dwellTimes: number[]; // time each key was held
    flightTimes: number[]; // time between keystrokes
    rhythm: number; // variance in timing
  };
  correctionRatio: number; // backspaces/total chars
  pauseDistribution: number[]; // length of pauses
};

export type CognitiveLoadIndicators = {
  thinkingPauses: number; // pauses > 2 seconds
  avgThinkingTime: number;
  longestPause: number;
  editingBehavior: {
    revisions: number;
    deletions: number;
    insertions: number;
    cursorMovements: number;
  };
  responseLatency: number; // time to start typing after AI response
  taskSwitching: number; // focus changes
};

export type LinguisticFeatures = {
  wordCount: number;
  charCount: number;
  avgWordLength: number;
  sentenceCount: number;
  avgSentenceLength: number;
  vocabularyRichness: number; // unique words / total words
  readabilityScore: number;
  semanticComplexity: number;
  emotionalTone: {
    positive: number;
    negative: number;
    neutral: number;
  };
  creativityIndicators: {
    uniqueWords: number;
    metaphorCount: number;
    questionCount: number;
    ideaCount: number; // estimated based on structure
  };
};

export type InteractionSequence = {
  sessionId: string;
  sequenceNumber: number;
  interactionType: 'message_start' | 'message_complete' | 'ai_response' | 'pause' | 'navigation';
  duration: number;
  context: any; // flexible context data
};

export type AdvancedTelemetry = {
  // Basic Info
  sessionId: string;
  userId: string;
  timestamp: number;
  
  // Environment
  language: string;
  platform: string;
  userAgent: string;
  screenResolution: string;
  viewport: string;
  timezone: string;
  devicePixelRatio: number;
  connectionType?: string;
  
  // Task Context
  taskType: "divergent" | "convergent";
  currentRound?: number | null;
  currentWordSet?: { words: string[]; answer: string } | null;
  taskProgress: number; // 0-100%
  
  // Behavioral Data
  typingPattern: TypingPattern;
  mouseActivity: MouseEvent[];
  keystrokeSequence: KeystrokeEvent[];
  cognitiveLoad: CognitiveLoadIndicators;
  
  // Content Analysis
  linguisticFeatures: LinguisticFeatures;
  messageMetrics: {
    responseTime: number;
    messageLength: number;
    editCount: number;
    finalMessageDifferentFromFirst: boolean;
  };
  
  // Interaction Patterns
  interactionSequence: InteractionSequence[];
  sessionDuration: number;
  totalMessages: number;
  avgMessageInterval: number;
  
  // Performance Metrics
  taskCompletion: boolean;
  qualityMetrics?: {
    relevanceScore: number;
    creativityScore: number;
    coherenceScore: number;
  };
  
  // Experimental Features
  attentionTracking?: {
    focusEvents: { timestamp: number; type: 'focus' | 'blur' }[];
    visibilityChanges: { timestamp: number; visible: boolean }[];
    scrollBehavior: { position: number; timestamp: number }[];
  };
  
  // ML-Ready Features
  featureVector: number[]; // Preprocessed numerical features for ML
  temporalFeatures: number[][]; // Time-series data for RNNs/LSTMs
};

export type Telemetry = AdvancedTelemetry;
