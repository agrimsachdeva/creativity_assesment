"use client";
import { useState, useEffect } from "react";

interface ClientTimestampProps {
  timestamp: number;
  className?: string;
}

export function ClientTimestamp({ timestamp, className = "" }: ClientTimestampProps) {
  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    // Only set the time string on the client to avoid hydration mismatch
    setTimeString(new Date(timestamp).toLocaleTimeString());
  }, [timestamp]);

  // Return empty during server-side rendering to match client-side initial state
  if (!timeString) {
    return <div className={className}></div>;
  }

  return <div className={className}>{timeString}</div>;
}
