import { 
  AdvancedTelemetry, 
  KeystrokeEvent, 
  MouseEvent as TelemetryMouseEvent, 
  TypingPattern, 
  CognitiveLoadIndicators, 
  LinguisticFeatures,
  InteractionSequence 
} from "./types";

export class TelemetryCollector {
  private sessionId: string;
  private userId: string;
  private taskType: "divergent" | "convergent";
  private sessionStartTime: number;
  
  // Data collection arrays
  private keystrokeEvents: KeystrokeEvent[] = [];
  private mouseEvents: TelemetryMouseEvent[] = [];
  private interactionSequence: InteractionSequence[] = [];
  private focusEvents: { timestamp: number; type: 'focus' | 'blur' }[] = [];
  private visibilityChanges: { timestamp: number; visible: boolean }[] = [];
  private scrollBehavior: { position: number; timestamp: number }[] = [];
  
  // State tracking
  private currentMessage: string = "";
  private messageStartTime: number = 0;
  private lastKeystrokeTime: number = 0;
  private lastMouseTime: number = 0;
  private currentSequenceNumber: number = 0;
  private totalMessages: number = 0;
  private responseLatencies: number[] = [];
  private messageIntervals: number[] = [];
  private lastAiResponseTime: number = 0;

  constructor(sessionId: string, userId: string, taskType: "divergent" | "convergent") {
    this.sessionId = sessionId;
    this.userId = userId;
    this.taskType = taskType;
    this.sessionStartTime = Date.now();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Mouse events
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('click', this.handleMouseClick.bind(this));
    document.addEventListener('wheel', this.handleMouseScroll.bind(this));
    
    // Focus events
    window.addEventListener('focus', this.handleFocus.bind(this));
    window.addEventListener('blur', this.handleBlur.bind(this));
    
    // Visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Scroll events
    window.addEventListener('scroll', this.handleScroll.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const timestamp = Date.now();
    const isBackspace = event.key === 'Backspace';
    const isSpecialKey = event.key.length > 1 && !isBackspace;
    
    const keystrokeEvent: KeystrokeEvent = {
      key: event.key,
      timestamp,
      type: 'keydown',
      isBackspace,
      isSpecialKey
    };
    
    this.keystrokeEvents.push(keystrokeEvent);
    this.lastKeystrokeTime = timestamp;
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const timestamp = Date.now();
    const keyDownEvent = this.keystrokeEvents
      .reverse()
      .find(e => e.key === event.key && e.type === 'keydown' && !e.duration);
    
    if (keyDownEvent) {
      keyDownEvent.duration = timestamp - keyDownEvent.timestamp;
    }
    
    const keystrokeEvent: KeystrokeEvent = {
      key: event.key,
      timestamp,
      type: 'keyup',
      isBackspace: event.key === 'Backspace',
      isSpecialKey: event.key.length > 1 && event.key !== 'Backspace'
    };
    
    this.keystrokeEvents.push(keystrokeEvent);
    this.keystrokeEvents.reverse(); // restore order
  }

  private handleMouseMove(event: MouseEvent): void {
    const timestamp = Date.now();
    const velocity = this.lastMouseTime ? 
      Math.sqrt(Math.pow(event.clientX, 2) + Math.pow(event.clientY, 2)) / (timestamp - this.lastMouseTime) : 0;
    
    const mouseEvent: TelemetryMouseEvent = {
      x: event.clientX,
      y: event.clientY,
      timestamp,
      type: 'move',
      element: this.getElementSelector(event.target as Element),
      velocity
    };
    
    this.mouseEvents.push(mouseEvent);
    this.lastMouseTime = timestamp;
    
    // Keep only last 1000 mouse moves to prevent memory issues
    if (this.mouseEvents.length > 1000) {
      this.mouseEvents = this.mouseEvents.slice(-1000);
    }
  }

  private handleMouseClick(event: MouseEvent): void {
    const mouseEvent: TelemetryMouseEvent = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
      type: 'click',
      element: this.getElementSelector(event.target as Element)
    };
    
    this.mouseEvents.push(mouseEvent);
  }

  private handleMouseScroll(event: WheelEvent): void {
    const mouseEvent: TelemetryMouseEvent = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
      type: 'scroll',
      element: this.getElementSelector(event.target as Element)
    };
    
    this.mouseEvents.push(mouseEvent);
  }

  private handleFocus(): void {
    this.focusEvents.push({ timestamp: Date.now(), type: 'focus' });
  }

  private handleBlur(): void {
    this.focusEvents.push({ timestamp: Date.now(), type: 'blur' });
  }

  private handleVisibilityChange(): void {
    this.visibilityChanges.push({
      timestamp: Date.now(),
      visible: !document.hidden
    });
  }

  private handleScroll(): void {
    this.scrollBehavior.push({
      position: window.scrollY,
      timestamp: Date.now()
    });
  }

  private getElementSelector(element: Element | null): string {
    if (!element) return '';
    
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  public startMessageComposition(): void {
    this.messageStartTime = Date.now();
    this.currentMessage = "";
    
    this.addInteractionSequence('message_start', 0, {});
  }

  public updateMessageContent(content: string): void {
    this.currentMessage = content;
  }

  public completeMessage(): void {
    const duration = Date.now() - this.messageStartTime;
    this.addInteractionSequence('message_complete', duration, {
      messageLength: this.currentMessage.length,
      wordCount: this.currentMessage.split(/\s+/).filter(w => w.length > 0).length
    });
    
    this.totalMessages++;
    
    if (this.totalMessages > 1) {
      const interval = this.messageStartTime - (this.messageIntervals[this.messageIntervals.length - 1] || this.sessionStartTime);
      this.messageIntervals.push(interval);
    }
  }

  public recordAiResponse(responseTime: number): void {
    this.lastAiResponseTime = Date.now();
    this.addInteractionSequence('ai_response', responseTime, {});
  }

  public recordResponseLatency(): void {
    if (this.lastAiResponseTime) {
      const latency = this.messageStartTime - this.lastAiResponseTime;
      this.responseLatencies.push(latency);
    }
  }

  private addInteractionSequence(
    type: InteractionSequence['interactionType'],
    duration: number,
    context: any
  ): void {
    this.interactionSequence.push({
      sessionId: this.sessionId,
      sequenceNumber: this.currentSequenceNumber++,
      interactionType: type,
      duration,
      context
    });
  }

  private calculateTypingPattern(): TypingPattern {
    const keyEvents = this.keystrokeEvents.filter(e => e.type === 'keydown' && !e.isSpecialKey);
    const backspaces = this.keystrokeEvents.filter(e => e.key === 'Backspace');
    
    const dwellTimes = this.keystrokeEvents
      .filter(e => e.duration !== undefined)
      .map(e => e.duration!);
    
    const flightTimes: number[] = [];
    for (let i = 1; i < keyEvents.length; i++) {
      flightTimes.push(keyEvents[i].timestamp - keyEvents[i-1].timestamp);
    }
    
    const pauses = flightTimes.filter(t => t > 500);
    const typingSpeeds = this.calculateTypingSpeeds();
    
    return {
      totalKeypresses: keyEvents.length,
      backspaceCount: backspaces.length,
      pauseCount: pauses.length,
      avgTypingSpeed: typingSpeeds.avg,
      peakTypingSpeed: typingSpeeds.peak,
      keystrokeDynamics: {
        dwellTimes,
        flightTimes,
        rhythm: this.calculateRhythm(flightTimes)
      },
      correctionRatio: keyEvents.length > 0 ? backspaces.length / keyEvents.length : 0,
      pauseDistribution: pauses
    };
  }

  private calculateTypingSpeeds(): { avg: number; peak: number } {
    const windows = this.getTypingWindows();
    const speeds = windows.map(w => (w.chars / w.duration) * 60000); // chars per minute
    
    return {
      avg: speeds.reduce((a, b) => a + b, 0) / speeds.length || 0,
      peak: Math.max(...speeds, 0)
    };
  }

  private getTypingWindows(): { chars: number; duration: number }[] {
    const windowSize = 10000; // 10 seconds
    const windows = [];
    const keyEvents = this.keystrokeEvents.filter(e => e.type === 'keydown' && !e.isSpecialKey);
    
    for (let i = 0; i < keyEvents.length; i++) {
      const windowStart = keyEvents[i].timestamp;
      const windowEnd = windowStart + windowSize;
      const windowEvents = keyEvents.filter(e => 
        e.timestamp >= windowStart && e.timestamp <= windowEnd
      );
      
      if (windowEvents.length > 0) {
        windows.push({
          chars: windowEvents.length,
          duration: windowEnd - windowStart
        });
      }
    }
    
    return windows;
  }

  private calculateRhythm(flightTimes: number[]): number {
    if (flightTimes.length < 2) return 0;
    
    const mean = flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length;
    const variance = flightTimes.reduce((acc, time) => acc + Math.pow(time - mean, 2), 0) / flightTimes.length;
    
    return Math.sqrt(variance);
  }

  private calculateCognitiveLoad(): CognitiveLoadIndicators {
    const longPauses = this.keystrokeEvents
      .filter((e, i, arr) => i > 0 && e.timestamp - arr[i-1].timestamp > 2000);
    
    const thinkingTimes = longPauses.map((e, i, arr) => 
      i > 0 ? e.timestamp - arr[i-1].timestamp : 0
    );
    
    const backspaces = this.keystrokeEvents.filter(e => e.key === 'Backspace');
    
    return {
      thinkingPauses: longPauses.length,
      avgThinkingTime: thinkingTimes.reduce((a, b) => a + b, 0) / thinkingTimes.length || 0,
      longestPause: Math.max(...thinkingTimes, 0),
      editingBehavior: {
        revisions: backspaces.length,
        deletions: backspaces.length,
        insertions: this.keystrokeEvents.filter(e => !e.isSpecialKey && e.key !== 'Backspace').length,
        cursorMovements: this.keystrokeEvents.filter(e => ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)).length
      },
      responseLatency: this.responseLatencies.reduce((a, b) => a + b, 0) / this.responseLatencies.length || 0,
      taskSwitching: this.focusEvents.filter(e => e.type === 'blur').length
    };
  }

  private calculateLinguisticFeatures(text: string): LinguisticFeatures {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    
    return {
      wordCount: words.length,
      charCount: text.length,
      avgWordLength: words.reduce((acc, word) => acc + word.length, 0) / words.length || 0,
      sentenceCount: sentences.length,
      avgSentenceLength: words.length / sentences.length || 0,
      vocabularyRichness: uniqueWords.size / words.length || 0,
      readabilityScore: this.calculateReadabilityScore(words, sentences),
      semanticComplexity: this.calculateSemanticComplexity(words),
      emotionalTone: this.analyzeEmotionalTone(text),
      creativityIndicators: this.analyzeCreativityIndicators(text, words)
    };
  }

  private calculateReadabilityScore(words: string[], sentences: string[]): number {
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = words.reduce((acc, word) => acc + this.countSyllables(word), 0) / words.length;
    
    // Simplified Flesch Reading Ease score
    return 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  }

  private countSyllables(word: string): number {
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (const char of word.toLowerCase()) {
      const isVowel = vowels.includes(char);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    if (word.endsWith('e')) count--;
    return Math.max(1, count);
  }

  private calculateSemanticComplexity(words: string[]): number {
    // Simple heuristic based on word length and variety
    const avgWordLength = words.reduce((acc, word) => acc + word.length, 0) / words.length || 0;
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const complexity = (avgWordLength * 0.3) + (uniqueWords / words.length * 0.7);
    
    return Math.min(1, complexity);
  }

  private analyzeEmotionalTone(text: string): { positive: number; negative: number; neutral: number } {
    // Simple sentiment analysis based on word patterns
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'joy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'difficult', 'problem'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positive = words.filter(word => positiveWords.some(pw => word.includes(pw))).length;
    const negative = words.filter(word => negativeWords.some(nw => word.includes(nw))).length;
    const total = words.length;
    
    return {
      positive: positive / total,
      negative: negative / total,
      neutral: (total - positive - negative) / total
    };
  }

  private analyzeCreativityIndicators(text: string, words: string[]): {
    uniqueWords: number;
    metaphorCount: number;
    questionCount: number;
    ideaCount: number;
  } {
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const metaphorIndicators = ['like', 'as', 'similar to', 'reminds me', 'appears to be'];
    const metaphorCount = metaphorIndicators.reduce((count, indicator) => 
      count + (text.toLowerCase().includes(indicator) ? 1 : 0), 0
    );
    
    const questionCount = (text.match(/\?/g) || []).length;
    const ideaCount = Math.max(1, (text.match(/[.!]/g) || []).length);
    
    return {
      uniqueWords,
      metaphorCount,
      questionCount,
      ideaCount
    };
  }

  public generateTelemetry(
    currentRound?: number | null,
    currentWordSet?: { words: string[]; answer: string } | null,
    taskProgress: number = 0,
    taskCompletion: boolean = false,
    lastMessage: string = ""
  ): AdvancedTelemetry {
    const now = Date.now();
    const typingPattern = this.calculateTypingPattern();
    const cognitiveLoad = this.calculateCognitiveLoad();
    const linguisticFeatures = this.calculateLinguisticFeatures(lastMessage);
    
    // Generate feature vectors for ML
    const featureVector = this.generateFeatureVector(typingPattern, cognitiveLoad, linguisticFeatures);
    const temporalFeatures = this.generateTemporalFeatures();
    
    return {
      // Basic Info
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: now,
      
      // Environment
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      devicePixelRatio: window.devicePixelRatio,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      
      // Task Context
      taskType: this.taskType,
      currentRound,
      currentWordSet,
      taskProgress,
      
      // Behavioral Data
      typingPattern,
      mouseActivity: [...this.mouseEvents],
      keystrokeSequence: [...this.keystrokeEvents],
      cognitiveLoad,
      
      // Content Analysis
      linguisticFeatures,
      messageMetrics: {
        responseTime: this.responseLatencies[this.responseLatencies.length - 1] || 0,
        messageLength: lastMessage.length,
        editCount: this.keystrokeEvents.filter(e => e.key === 'Backspace').length,
        finalMessageDifferentFromFirst: true // TODO: implement comparison
      },
      
      // Interaction Patterns
      interactionSequence: [...this.interactionSequence],
      sessionDuration: now - this.sessionStartTime,
      totalMessages: this.totalMessages,
      avgMessageInterval: this.messageIntervals.reduce((a, b) => a + b, 0) / this.messageIntervals.length || 0,
      
      // Performance Metrics
      taskCompletion,
      qualityMetrics: {
        relevanceScore: 0.5, // TODO: implement NLP-based scoring
        creativityScore: linguisticFeatures.creativityIndicators.uniqueWords / linguisticFeatures.wordCount || 0,
        coherenceScore: Math.min(1, linguisticFeatures.avgSentenceLength / 20)
      },
      
      // Experimental Features
      attentionTracking: {
        focusEvents: [...this.focusEvents],
        visibilityChanges: [...this.visibilityChanges],
        scrollBehavior: [...this.scrollBehavior]
      },
      
      // ML-Ready Features
      featureVector,
      temporalFeatures
    };
  }

  private generateFeatureVector(
    typing: TypingPattern, 
    cognitive: CognitiveLoadIndicators, 
    linguistic: LinguisticFeatures
  ): number[] {
    return [
      // Typing features
      typing.avgTypingSpeed,
      typing.peakTypingSpeed,
      typing.correctionRatio,
      typing.pauseCount,
      typing.keystrokeDynamics.rhythm,
      
      // Cognitive features
      cognitive.thinkingPauses,
      cognitive.avgThinkingTime,
      cognitive.responseLatency,
      cognitive.taskSwitching,
      cognitive.editingBehavior.revisions,
      
      // Linguistic features
      linguistic.wordCount,
      linguistic.vocabularyRichness,
      linguistic.readabilityScore / 100, // normalize
      linguistic.semanticComplexity,
      linguistic.creativityIndicators.uniqueWords,
      
      // Behavioral features
      this.mouseEvents.length,
      this.focusEvents.filter(e => e.type === 'blur').length,
      this.sessionDuration / 60000, // minutes
      this.totalMessages
    ];
  }

  private generateTemporalFeatures(): number[][] {
    // Generate time-series features for RNN/LSTM models
    const windowSize = 1000; // 1 second windows
    const features: number[][] = [];
    
    const startTime = this.sessionStartTime;
    const endTime = Date.now();
    
    for (let time = startTime; time < endTime; time += windowSize) {
      const windowEnd = time + windowSize;
      
      const keystrokesInWindow = this.keystrokeEvents.filter(e => 
        e.timestamp >= time && e.timestamp < windowEnd
      ).length;
      
      const mouseEventsInWindow = this.mouseEvents.filter(e => 
        e.timestamp >= time && e.timestamp < windowEnd
      ).length;
      
      const pausesInWindow = this.keystrokeEvents.filter((e, i, arr) => 
        i > 0 && 
        e.timestamp >= time && 
        e.timestamp < windowEnd &&
        e.timestamp - arr[i-1].timestamp > 500
      ).length;
      
      features.push([
        keystrokesInWindow,
        mouseEventsInWindow,
        pausesInWindow,
        time - startTime // relative time
      ]);
    }
    
    return features;
  }

  private get sessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  public cleanup(): void {
    // Remove event listeners to prevent memory leaks
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('click', this.handleMouseClick.bind(this));
    document.removeEventListener('wheel', this.handleMouseScroll.bind(this));
    window.removeEventListener('focus', this.handleFocus.bind(this));
    window.removeEventListener('blur', this.handleBlur.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.removeEventListener('scroll', this.handleScroll.bind(this));
  }
}
