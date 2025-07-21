import React from "react";

export function SetupGuide() {
  return (
    <div className="mt-8 backdrop-blur-sm bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
      <h3 className="text-2xl font-bold text-white mb-6 text-center">🛠️ Setup Guide</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* OpenAI API Setup */}
        <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10">
          <h4 className="text-lg font-bold text-white mb-3 flex items-center">
            <span className="mr-2">🤖</span>
            OpenAI API Configuration
          </h4>
          <div className="text-white/80 text-sm space-y-2">
            <p>1. Get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">OpenAI Platform</a></p>
            <p>2. Add it to your <code className="bg-white/10 px-1 rounded">.env.local</code> file:</p>
            <pre className="bg-black/20 p-2 rounded text-xs">OPENAI_API_KEY=sk-your-key-here</pre>
            <p>3. Restart the development server</p>
          </div>
        </div>

        {/* Database Setup */}
        <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10">
          <h4 className="text-lg font-bold text-white mb-3 flex items-center">
            <span className="mr-2">🗄️</span>
            Database Configuration
          </h4>
          <div className="text-white/80 text-sm space-y-2">
            <p>1. Create a <a href="https://vercel.com/storage/postgres" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Vercel Postgres</a> database</p>
            <p>2. Copy the connection string to <code className="bg-white/10 px-1 rounded">.env.local</code>:</p>
            <pre className="bg-black/20 p-2 rounded text-xs">POSTGRES_URL=postgres://...</pre>
            <p>3. Run the SQL migration from <code className="bg-white/10 px-1 rounded">interactions.sql</code></p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <div className="inline-block backdrop-blur-sm bg-blue-500/20 px-6 py-3 rounded-2xl border border-blue-400/30">
          <p className="text-blue-200 text-sm">
            💡 <strong>Note:</strong> The app will work without database configuration - data will be logged to console for development
          </p>
        </div>
      </div>
    </div>
  );
}
