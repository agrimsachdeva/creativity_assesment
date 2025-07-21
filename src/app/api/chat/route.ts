import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { messages, taskType, telemetry, qualtricsId } = await req.json();
  const userAgent = req.headers.get("user-agent");
  const ip = req.headers.get("x-forwarded-for") || null;
  const timestamp = Date.now();

  // Log interaction to Vercel Postgres (with error handling for development)
  try {
    if (process.env.POSTGRES_URL && process.env.POSTGRES_URL !== "your-vercel-postgres-connection-string-here") {
      await sql`
        INSERT INTO interactions (messages, task_type, telemetry, user_agent, ip, timestamp, qualtrics_id)
        VALUES (${JSON.stringify(messages)}, ${taskType || null}, ${JSON.stringify(telemetry)}, ${userAgent}, ${ip}, ${timestamp}, ${qualtricsId || null})
      `;
    } else {
      console.log("Database not configured - interaction data would be logged here:", {
        messages: messages.length + " messages",
        taskType,
        qualtricsId,
        timestamp: new Date(timestamp).toISOString()
      });
    }
  } catch (error) {
    console.error("Database logging error:", error);
    // Continue with API call even if database logging fails
  }

  // Call OpenAI API
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your-openai-api-key-here") {
      // Mock response for development/testing
      const mockResponse = {
        role: "assistant",
        content: `🤖 **[DEMO MODE]** This is a simulated AI response since no OpenAI API key is configured. 

${taskType === "convergent" 
  ? "For the RAT task, I would help you think through the connections between the three words and suggest possible answers based on common associations, wordplay, and semantic relationships."
  : "For divergent thinking, I would encourage you to explore multiple creative possibilities, ask thought-provoking questions, and help you break conventional thinking patterns to generate innovative ideas."
}

*To enable real ChatGPT responses, please add your OpenAI API key to the .env.local file.*`,
        timestamp: Date.now(),
      };
      
      return NextResponse.json({ response: mockResponse });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
    });
    
    const aiResponse = {
      role: "assistant",
      content: completion.choices[0].message.content,
      timestamp: Date.now(),
    };

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("OpenAI API error:", error);
    
    // Provide specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("Incorrect API key")) {
        return NextResponse.json(
          { error: "Invalid or expired OpenAI API key. Please check your API key in .env.local file." }, 
          { status: 401 }
        );
      } else if (error.message.includes("429")) {
        return NextResponse.json(
          { error: "OpenAI API rate limit exceeded. Please try again later." }, 
          { status: 429 }
        );
      } else if (error.message.includes("insufficient_quota")) {
        return NextResponse.json(
          { error: "OpenAI API quota exceeded. Please check your billing on OpenAI platform." }, 
          { status: 402 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to get AI response" }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  // For admin: return all logs (protect in production)
  const { rows } = await sql`SELECT * FROM interactions ORDER BY timestamp DESC LIMIT 100`;
  return NextResponse.json({ logs: rows });
}
