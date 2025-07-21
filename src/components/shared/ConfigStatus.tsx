import React from "react";

interface ConfigStatusProps {
  className?: string;
}

export function ConfigStatus({ className = "" }: ConfigStatusProps) {
  const [status, setStatus] = React.useState<{
    openai: boolean;
    database: boolean;
    loading: boolean;
  }>({ openai: false, database: false, loading: true });

  React.useEffect(() => {
    // Check API status
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        messages: [], 
        taskType: "divergent", 
        telemetry: {}, 
        qualtricsId: null 
      }),
    })
    .then(res => res.json())
    .then(data => {
      setStatus({
        openai: !data.error || !data.error.includes("OpenAI API key"),
        database: true, // We'll assume database is OK since it has fallback
        loading: false
      });
    })
    .catch(() => {
      setStatus({
        openai: false,
        database: false,
        loading: false
      });
    });
  }, []);

  if (status.loading) return null;

  return (
    <div className={`text-center ${className}`}>
      <div className="inline-block backdrop-blur-sm bg-white/10 px-4 py-2 rounded-2xl border border-white/20 shadow-lg">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${status.openai ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-white/80">AI Service</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${status.database ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <span className="text-white/80">Database</span>
          </div>
        </div>
      </div>
    </div>
  );
}
