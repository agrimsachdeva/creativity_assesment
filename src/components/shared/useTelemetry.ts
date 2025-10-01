import { useEffect, useRef, useCallback, useState } from 'react';
import { TelemetryCollector } from './telemetryCollector';
import { AdvancedTelemetry } from './types';
import { generateSessionId, generateUserId } from './api';

export function useTelemetry(taskType: "divergent" | "convergent") {
  const collectorRef = useRef<TelemetryCollector | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());
  const userIdRef = useRef<string>(generateUserId());
  const [engagementMetrics, setEngagementMetrics] = useState({
    copyPasteCount: 0,
    chatbotUsagePercentage: 0,
    chatbotEngagementCount: 0,
  });

  useEffect(() => {
    // Initialize telemetry collector
    collectorRef.current = new TelemetryCollector(
      sessionIdRef.current,
      userIdRef.current,
      taskType
    );

    // Cleanup on unmount
    return () => {
      if (collectorRef.current) {
        collectorRef.current.cleanup();
      }
    };
  }, [taskType]);

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

  return {
    sessionId: sessionIdRef.current,
    userId: userIdRef.current,
    engagementMetrics,
    startMessageComposition,
    updateMessageContent,
    completeMessage,
    recordAiResponse,
    recordResponseLatency,
    recordCopyPaste,
    recordChatbotUsage,
    generateTelemetry
  };
}
