import React from "react";

interface SessionInfoProps {
  qualtricsId: string | null;
  sessionId?: string;
  userId?: string;
}

export function SessionInfo({ qualtricsId, sessionId, userId }: SessionInfoProps) {
  const hasAnyId = qualtricsId || sessionId || userId;
  
  if (!hasAnyId) return null;

  return (
    <div className="mt-8 text-center">
      <div className="inline-block backdrop-blur-sm bg-white/10 px-6 py-3 rounded-2xl border border-white/20 shadow-lg">
        <div className="text-white/80 text-sm space-y-1">
          {qualtricsId && (
            <div>
              Experiment ID: <span className="font-mono font-bold text-cyan-300">{qualtricsId}</span>
            </div>
          )}
          {sessionId && (
            <div>
              Session ID: <span className="font-mono font-bold text-purple-300">{sessionId.slice(-12)}</span>
            </div>
          )}
          {userId && (
            <div>
              User ID: <span className="font-mono font-bold text-pink-300">{userId.slice(-8)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
