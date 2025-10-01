import React, { useEffect, useRef } from "react";
import { Message } from "./types";
import { ClientTimestamp } from "./ClientTimestamp";

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  loading: boolean;
  taskType: "divergent" | "convergent";
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onStartComposition?: () => void;
  onUpdateContent?: (content: string) => void;
  onCompleteMessage?: () => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export function ChatInterface({
  messages,
  input,
  loading,
  taskType,
  onInputChange,
  onSendMessage,
  onStartComposition,
  onUpdateContent,
  onCompleteMessage,
  emptyStateTitle = "Ready to Explore Your Creativity?",
  emptyStateDescription
}: ChatInterfaceProps) {
  const isComposingRef = useRef(false);
  const lastInputLengthRef = useRef(0);

  const defaultDescription = taskType === "divergent" 
    ? "Let your imagination run wild! Generate multiple ideas, think outside the box, and explore endless possibilities."
    : "Focus your mind like a laser! Find the optimal solution through logical analysis and systematic thinking.";

  const handleInputChange = (value: string) => {
    // Start composition tracking when user starts typing
    if (!isComposingRef.current && value.length > 0 && lastInputLengthRef.current === 0) {
      onStartComposition?.();
      isComposingRef.current = true;
    }

    // Track content updates
    onUpdateContent?.(value);
    onInputChange(value);
    lastInputLengthRef.current = value.length;
  };

  const handleSendMessage = () => {
    // Complete message tracking
    if (isComposingRef.current) {
      onCompleteMessage?.();
      isComposingRef.current = false;
    }
    
    onSendMessage();
    lastInputLengthRef.current = 0;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Reset composition state when input is cleared externally
  useEffect(() => {
    if (input.length === 0 && isComposingRef.current) {
      isComposingRef.current = false;
      lastInputLengthRef.current = 0;
    }
  }, [input]);

  return (
    <div className="backdrop-blur-lg bg-white/10 rounded-xl border border-white/20 shadow-lg flex flex-col" style={{height: '600px'}}>
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" style={{minHeight: '400px'}}>
        {messages.length === 0 ? (
          <div className="text-center text-white/80 mt-20">
            <div className="text-8xl mb-6 animate-pulse">💭</div>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {emptyStateTitle}
            </h3>
            <p className="text-lg mb-6">
              {emptyStateDescription || defaultDescription}
            </p>
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-white font-semibold animate-bounce">
              Start your journey below ⬇️
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                <div className={`max-w-sm lg:max-w-md relative group ${msg.role === "user" ? "order-2" : "order-1"}`}> 
                  {/* Message Bubble */}
                  <div className={`px-4 py-2 rounded-xl border transition-all duration-300 group-hover:shadow-lg ${msg.role === "user" ? "bg-purple-600 text-white border-purple-400 ml-5" : "bg-cyan-600 text-white border-cyan-400 mr-5"}`}>
                    <div className={`text-xs font-semibold mb-1 ${msg.role === "user" ? "text-purple-200" : "text-cyan-100"}`}>{msg.role === "user" ? "You" : "AI Assistant"}</div>
                    <p className="text-sm leading-normal">{msg.content}</p>
                    <ClientTimestamp 
                      timestamp={msg.timestamp} 
                      className={`text-xs mt-2 ${msg.role === "user" ? "text-purple-200" : "text-cyan-100"}`} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {loading && (
          <div className="flex justify-start mt-6 animate-fade-in">
            <div className="relative">
              <div className="absolute -left-12 top-0 w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg">
                🤖
              </div>
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-4 shadow-xl mr-6">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-white/80 text-sm">AI is crafting a response...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Input Area */}
      <div className="p-3 bg-white/5 backdrop-blur-sm border-t border-white/10 flex-shrink-0" style={{height: '80px'}}>
        <div className="flex space-x-2 items-center h-full">
          <div className="flex-1 relative">
            <textarea
              id="chat-input"
              name="chatMessage"
              className="w-full h-9 px-3 py-1 bg-white text-gray-900 border border-white/20 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none transition-all duration-300 align-middle text-sm"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask AI.. (Press Enter to send)`}
              disabled={loading}
              rows={1}
              style={{minHeight: '2.25rem', maxHeight: '2.25rem'}}
            />
          </div>
          <button
            className="px-4 h-9 py-1 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-1 align-middle text-sm"
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
          >
            <span>Send</span>
            <span className="text-base">🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
}
