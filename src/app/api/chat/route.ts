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

  // Log interaction to Vercel Postgres
  await sql`
    INSERT INTO interactions (messages, task_type, telemetry, user_agent, ip, timestamp, qualtrics_id)
    VALUES (${JSON.stringify(messages)}, ${taskType || null}, ${JSON.stringify(telemetry)}, ${userAgent}, ${ip}, ${timestamp}, ${qualtricsId || null})
  `;

  // Call OpenAI API
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
}

export async function GET() {
  // For admin: return all logs (protect in production)
  const { rows } = await sql`SELECT * FROM interactions ORDER BY timestamp DESC LIMIT 100`;
  return NextResponse.json({ logs: rows });
}
