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
    return {
      ...engagementMetrics,
      copyPasteEvents,
      aiUsageTracking,
      aiResponsesCount: aiResponses.length,
    };
  }, [engagementMetrics, copyPasteEvents, aiUsageTracking, aiResponses]);

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
    generateTelemetry
  };
}
