import { useEffect, useRef, useCallback } from 'react';
import { TelemetryCollector } from './telemetryCollector';
import { AdvancedTelemetry } from './types';
import { generateSessionId, generateUserId } from './api';

export function useTelemetry(taskType: "divergent" | "convergent") {
  const collectorRef = useRef<TelemetryCollector | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());
  const userIdRef = useRef<string>(generateUserId());

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
    startMessageComposition,
    updateMessageContent,
    completeMessage,
    recordAiResponse,
    recordResponseLatency,
    generateTelemetry
  };
}
