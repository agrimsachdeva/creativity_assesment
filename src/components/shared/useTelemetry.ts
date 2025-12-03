import { useEffect, useRef, useCallback, useState } from 'react';
import { TelemetryCollector } from './telemetryCollector';
import { AdvancedTelemetry } from './types';
import { generateSessionId, generateUserId } from './api';

export interface CopyPasteEvent {
  timestamp: number;
  type: 'copy' | 'paste';
  source: 'chat' | 'task' | 'external';
  textLength: number;
  textPreview: string; // First 50 chars
}

export interface AIUsageTracking {
  aiResponsesCopied: number;
  aiTextUsedInAnswers: number;
  totalAiTextLength: number;
  totalUserAnswerLength: number;
  aiUsagePercentage: number;
  matchedSegments: { aiText: string; userText: string; similarity: number }[];
}

// Help-seeking behavior tracking
export interface HelpSeekingMetrics {
  helpSeekingLatency: number | null;      // ms - How quickly do they turn to AI when stuck?
  independentSolveAttempts: number;       // Answers submitted without any AI interaction
  aiAsFirstResort: boolean;               // Did they ask AI before trying themselves?
  aiAsLastResort: boolean;                // Did they only ask AI after multiple failed attempts?
  totalAIQueries: number;                 // Total number of times user asked AI
  attemptsBeforeFirstAIQuery: number;     // How many attempts before first AI help
  timeBeforeFirstAIQuery: number | null;  // ms - Time spent before asking AI
  aiQueriesPerRound: number[];            // AI queries broken down by round
}

export function useTelemetry(taskType: "divergent" | "convergent") {
  const collectorRef = useRef<TelemetryCollector | null>(null);
  const sessionIdRef = useRef<string>('');
  const userIdRef = useRef<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [copyPasteEvents, setCopyPasteEvents] = useState<CopyPasteEvent[]>([]);
  const [aiResponses, setAiResponses] = useState<string[]>([]);
  const [aiUsageTracking, setAiUsageTracking] = useState<AIUsageTracking>({
    aiResponsesCopied: 0,
    aiTextUsedInAnswers: 0,
    totalAiTextLength: 0,
    totalUserAnswerLength: 0,
    aiUsagePercentage: 0,
    matchedSegments: [],
  });
  const [engagementMetrics, setEngagementMetrics] = useState({
    copyPasteCount: 0,
    chatbotUsagePercentage: 0,
    chatbotEngagementCount: 0,
  });

  // Help-seeking behavior tracking
  const taskStartTimeRef = useRef<number>(Date.now());
  const firstAIQueryTimeRef = useRef<number | null>(null);
  const [hasAskedAI, setHasAskedAI] = useState(false);
  const [attemptsBeforeAI, setAttemptsBeforeAI] = useState(0);
  const [independentSolveAttempts, setIndependentSolveAttempts] = useState(0);
  const [totalAIQueries, setTotalAIQueries] = useState(0);
  const [currentRoundAIQueries, setCurrentRoundAIQueries] = useState(0);
  const [aiQueriesPerRound, setAiQueriesPerRound] = useState<number[]>([]);

  useEffect(() => {
    // Generate IDs only on the client to avoid hydration mismatch
    if (!sessionIdRef.current) {
      sessionIdRef.current = generateSessionId();
    }
    if (!userIdRef.current) {
      userIdRef.current = generateUserId();
    }

    // Initialize telemetry collector
    collectorRef.current = new TelemetryCollector(
      sessionIdRef.current,
      userIdRef.current,
      taskType
    );

    // Set up global copy/paste event listeners
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection()?.toString() || '';
      const source = determineSource(e.target as Element);
      
      const event: CopyPasteEvent = {
        timestamp: Date.now(),
        type: 'copy',
        source,
        textLength: selection.length,
        textPreview: selection.substring(0, 50),
      };
      
      setCopyPasteEvents(prev => [...prev, event]);
      setEngagementMetrics(prev => ({
        ...prev,
        copyPasteCount: prev.copyPasteCount + 1,
      }));
      
      // Track if copying from AI chat
      if (source === 'chat') {
        setAiUsageTracking(prev => ({
          ...prev,
          aiResponsesCopied: prev.aiResponsesCopied + 1,
        }));
      }
      
      console.log('[Telemetry] Copy event:', event);
    };

    const handlePaste = (e: ClipboardEvent) => {
      const pastedText = e.clipboardData?.getData('text') || '';
      const source = determineSource(e.target as Element);
      
      const event: CopyPasteEvent = {
        timestamp: Date.now(),
        type: 'paste',
        source,
        textLength: pastedText.length,
        textPreview: pastedText.substring(0, 50),
      };
      
      setCopyPasteEvents(prev => [...prev, event]);
      setEngagementMetrics(prev => ({
        ...prev,
        copyPasteCount: prev.copyPasteCount + 1,
      }));
      
      console.log('[Telemetry] Paste event:', event);
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    // Mark as initialized
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      if (collectorRef.current) {
        collectorRef.current.cleanup();
      }
    };
  }, [taskType]);

  // Helper to determine if copy/paste is from chat, task input, or external
  const determineSource = (target: Element | null): 'chat' | 'task' | 'external' => {
    if (!target) return 'external';
    
    // Check if within chat interface
    if (target.closest('[data-chat-interface]') || target.closest('.chat-message')) {
      return 'chat';
    }
    // Check if within task input area
    if (target.closest('[data-task-input]') || target.closest('.task-input')) {
      return 'task';
    }
    return 'external';
  };

  const startMessageComposition = useCallback(() => {
    collectorRef.current?.startMessageComposition();
  }, []);

  const updateMessageContent = useCallback((content: string) => {
    collectorRef.current?.updateMessageContent(content);
  }, []);

  const completeMessage = useCallback(() => {
    collectorRef.current?.completeMessage();
  }, []);

  const recordAiResponse = useCallback((responseTime: number) => {
    collectorRef.current?.recordAiResponse(responseTime);
  }, []);

  const recordResponseLatency = useCallback(() => {
    collectorRef.current?.recordResponseLatency();
  }, []);

  const recordCopyPaste = useCallback(() => {
    setEngagementMetrics((prev) => ({
      ...prev,
      copyPasteCount: prev.copyPasteCount + 1,
    }));
  }, []);

  const recordChatbotUsage = useCallback((percentage: number) => {
    setEngagementMetrics((prev) => ({
      ...prev,
      chatbotUsagePercentage: percentage,
    }));
  }, []);

  // Track AI responses for later comparison
  const recordAiResponseText = useCallback((responseText: string) => {
    setAiResponses(prev => [...prev, responseText]);
    setAiUsageTracking(prev => ({
      ...prev,
      totalAiTextLength: prev.totalAiTextLength + responseText.length,
    }));
    console.log('[Telemetry] AI response recorded for tracking:', responseText.substring(0, 50) + '...');
  }, []);

  // Calculate how much of user's answer overlaps with AI suggestions
  const calculateAiUsageInAnswer = useCallback((userAnswer: string) => {
    if (!userAnswer || aiResponses.length === 0) return;
    
    const matchedSegments: { aiText: string; userText: string; similarity: number }[] = [];
    let totalMatchedChars = 0;
    
    // Split user answer into words and check for matches in AI responses
    const userWords = userAnswer.toLowerCase().split(/\s+/);
    const userPhrases = [];
    
    // Create 3-5 word phrases from user answer for comparison
    for (let i = 0; i < userWords.length - 2; i++) {
      userPhrases.push(userWords.slice(i, i + 3).join(' '));
      if (i < userWords.length - 4) {
        userPhrases.push(userWords.slice(i, i + 5).join(' '));
      }
    }
    
    // Check each AI response for matching phrases
    for (const aiResponse of aiResponses) {
      const aiLower = aiResponse.toLowerCase();
      for (const phrase of userPhrases) {
        if (aiLower.includes(phrase) && phrase.length > 10) {
          totalMatchedChars += phrase.length;
          matchedSegments.push({
            aiText: phrase,
            userText: phrase,
            similarity: 1.0,
          });
        }
      }
    }
    
    const aiUsagePercentage = userAnswer.length > 0 
      ? Math.min(100, (totalMatchedChars / userAnswer.length) * 100)
      : 0;
    
    setAiUsageTracking(prev => ({
      ...prev,
      aiTextUsedInAnswers: prev.aiTextUsedInAnswers + totalMatchedChars,
      totalUserAnswerLength: prev.totalUserAnswerLength + userAnswer.length,
      aiUsagePercentage,
      matchedSegments: [...prev.matchedSegments, ...matchedSegments],
    }));
    
    setEngagementMetrics(prev => ({
      ...prev,
      chatbotUsagePercentage: aiUsagePercentage,
    }));
    
    console.log('[Telemetry] AI usage in answer:', {
      userAnswerLength: userAnswer.length,
      matchedChars: totalMatchedChars,
      aiUsagePercentage,
      matchedSegments: matchedSegments.length,
    });
  }, [aiResponses]);

  // === HELP-SEEKING BEHAVIOR TRACKING ===
  
  // Record when user sends a message to AI (asks for help)
  const recordAIQuery = useCallback(() => {
    const now = Date.now();
    
    // Track first AI query time
    if (!hasAskedAI) {
      setHasAskedAI(true);
      firstAIQueryTimeRef.current = now;
      console.log('[Telemetry] First AI query at:', now - taskStartTimeRef.current, 'ms after task start');
    }
    
    setTotalAIQueries(prev => prev + 1);
    setCurrentRoundAIQueries(prev => prev + 1);
    
    console.log('[Telemetry] AI query recorded. Total:', totalAIQueries + 1);
  }, [hasAskedAI, totalAIQueries]);

  // Record when user submits an answer (to track independent vs AI-assisted)
  const recordAnswerSubmission = useCallback((wasAIAssistedThisRound: boolean) => {
    if (!wasAIAssistedThisRound && !hasAskedAI) {
      // User submitted without asking AI at all
      setIndependentSolveAttempts(prev => prev + 1);
      console.log('[Telemetry] Independent solve recorded');
    }
    
    // If they haven't asked AI yet, this counts as an attempt before AI
    if (!hasAskedAI) {
      setAttemptsBeforeAI(prev => prev + 1);
    }
  }, [hasAskedAI]);

  // Record when a round is complete (for per-round AI query tracking)
  const recordRoundComplete = useCallback(() => {
    setAiQueriesPerRound(prev => [...prev, currentRoundAIQueries]);
    setCurrentRoundAIQueries(0);
    // Reset hasAskedAI for the new round to track per-round behavior
    setHasAskedAI(false);
    console.log('[Telemetry] Round complete. AI queries this round:', currentRoundAIQueries);
  }, [currentRoundAIQueries]);

  // Reset help-seeking metrics (for restart)
  const resetHelpSeekingMetrics = useCallback(() => {
    taskStartTimeRef.current = Date.now();
    firstAIQueryTimeRef.current = null;
    setHasAskedAI(false);
    setAttemptsBeforeAI(0);
    setIndependentSolveAttempts(0);
    setTotalAIQueries(0);
    setCurrentRoundAIQueries(0);
    setAiQueriesPerRound([]);
    console.log('[Telemetry] Help-seeking metrics reset');
  }, []);

  // Get help-seeking metrics summary
  const getHelpSeekingMetrics = useCallback((): HelpSeekingMetrics => {
    const helpSeekingLatency = firstAIQueryTimeRef.current 
      ? firstAIQueryTimeRef.current - taskStartTimeRef.current 
      : null;
    
    const allRoundQueries = [...aiQueriesPerRound, currentRoundAIQueries];
    const totalQueries = totalAIQueries;
    
    return {
      helpSeekingLatency,
      independentSolveAttempts,
      aiAsFirstResort: attemptsBeforeAI === 0 && totalQueries > 0,
      aiAsLastResort: attemptsBeforeAI >= 2 && totalQueries > 0,
      totalAIQueries: totalQueries,
      attemptsBeforeFirstAIQuery: attemptsBeforeAI,
      timeBeforeFirstAIQuery: helpSeekingLatency,
      aiQueriesPerRound: allRoundQueries,
    };
  }, [aiQueriesPerRound, currentRoundAIQueries, totalAIQueries, independentSolveAttempts, attemptsBeforeAI]);

  const generateTelemetry = useCallback((
    currentRound?: number | null,
    currentWordSet?: { words: string[]; answer: string } | null,
    taskProgress: number = 0,
    taskCompletion: boolean = false,
    lastMessage: string = ""
  ): AdvancedTelemetry | null => {
    if (!collectorRef.current) return null;
    
    return collectorRef.current.generateTelemetry(
      currentRound,
      currentWordSet,
      taskProgress,
      taskCompletion,
      lastMessage
    );
  }, []);

  // Get complete engagement data for database
  const getEngagementData = useCallback(() => {
    // Create a human-readable summary of copy/paste behavior
    const copyFromChat = copyPasteEvents.filter(e => e.type === 'copy' && e.source === 'chat').length;
    const copyFromExternal = copyPasteEvents.filter(e => e.type === 'copy' && e.source === 'external').length;
    const pasteToTask = copyPasteEvents.filter(e => e.type === 'paste' && e.source === 'task').length;
    const pasteToChat = copyPasteEvents.filter(e => e.type === 'paste' && e.source === 'chat').length;
    
    // Detect if user copied from AI and pasted to task (direct AI usage)
    let directAiCopyToTask = 0;
    for (let i = 0; i < copyPasteEvents.length - 1; i++) {
      const current = copyPasteEvents[i];
      const next = copyPasteEvents[i + 1];
      if (current.type === 'copy' && current.source === 'chat' && 
          next.type === 'paste' && next.source === 'task' &&
          Math.abs(current.textLength - next.textLength) <= 5) { // Allow small difference for line endings
        directAiCopyToTask++;
      }
    }
    
    // Human-readable summary
    const summary = {
      totalCopyPasteActions: copyPasteEvents.length,
      copiedFromAI: copyFromChat,
      copiedFromExternal: copyFromExternal,
      pastedIntoAnswer: pasteToTask,
      pastedIntoChat: pasteToChat,
      directAiCopyToAnswer: directAiCopyToTask,
      aiInfluenceLevel: directAiCopyToTask > 0 ? 'high' : (copyFromChat > 0 ? 'medium' : (pasteToChat > 0 ? 'low' : 'none')),
      interpretation: directAiCopyToTask > 0 
        ? `User directly copied AI response ${directAiCopyToTask} time(s) into their answer`
        : copyFromChat > 0 
          ? `User copied from AI chat ${copyFromChat} time(s) but may have modified before using`
          : pasteToChat > 0
            ? `User pasted content into chat ${pasteToChat} time(s) to get AI help`
            : 'No direct AI text usage detected'
    };
    
    // Get help-seeking metrics
    const helpSeeking = getHelpSeekingMetrics();
    
    return {
      ...engagementMetrics,
      summary, // Human-readable summary
      copyPasteEvents, // Raw events for detailed analysis
      aiUsageTracking,
      aiResponsesCount: aiResponses.length,
      helpSeeking, // Help-seeking behavior metrics
    };
  }, [engagementMetrics, copyPasteEvents, aiUsageTracking, aiResponses, getHelpSeekingMetrics]);

  return {
    sessionId: isInitialized ? sessionIdRef.current : '',
    userId: isInitialized ? userIdRef.current : '',
    isInitialized,
    engagementMetrics,
    copyPasteEvents,
    aiUsageTracking,
    startMessageComposition,
    updateMessageContent,
    completeMessage,
    recordAiResponse,
    recordResponseLatency,
    recordCopyPaste,
    recordChatbotUsage,
    recordAiResponseText,
    calculateAiUsageInAnswer,
    getEngagementData,
    generateTelemetry,
    // Help-seeking behavior tracking
    recordAIQuery,
    recordAnswerSubmission,
    recordRoundComplete,
    resetHelpSeekingMetrics,
    getHelpSeekingMetrics,
  };
}
