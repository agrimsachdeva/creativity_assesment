import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const {
    subjectId, // Unique identifier for the subject
    taskType, // Task type (e.g., 'divergent' or 'convergent')
    transcript, // Full chat transcript (user and AI messages)
    taskResponses, // Responses to the task (e.g., AUT ideas or RAT answers)
    engagementMetrics, // Analytics (e.g., copy/paste info, chatbot usage)
    startTime, // Experiment start time
    endTime, // Experiment end time
    qualtricsId // Optional Qualtrics ID for tracking
  } = await req.json();

  // Validate required fields
  const missingFields = [];
  if (!subjectId) missingFields.push("subjectId");
  if (!taskType) missingFields.push("taskType");
  if (!transcript) missingFields.push("transcript");
  if (!taskResponses) missingFields.push("taskResponses");
  if (!engagementMetrics) missingFields.push("engagementMetrics");
  if (!startTime) missingFields.push("startTime");
  if (!endTime) missingFields.push("endTime");

  if (missingFields.length > 0) {
    console.error("Missing required fields:", missingFields);
    return NextResponse.json({
      error: `Missing required fields: ${missingFields.join(", ")}`
    }, { status: 400 });
  }

  try {
    await sql`
      INSERT INTO interactions (
        subject_id, task_type, transcript, task_responses, engagement_metrics, start_time, end_time, qualtrics_id
      ) VALUES (
        ${subjectId}, ${taskType}, ${JSON.stringify(transcript)}, ${JSON.stringify(taskResponses)}, ${JSON.stringify(engagementMetrics)}, ${startTime}, ${endTime}, ${qualtricsId}
      )
    `;

    const responsePayload = {
      success: true,
      response: {
        subjectId,
        taskType,
        transcript,
        taskResponses,
        engagementMetrics,
        startTime,
        endTime,
        qualtricsId
      }
    };

    console.log("Server response payload:", responsePayload);
    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Database logging error:", error);
    return NextResponse.json({ error: "Failed to save interaction data" }, { status: 500 });
  }
}

export async function GET() {
  // For admin: return all logs (protect in production)
  const { rows } = await sql`SELECT * FROM interactions ORDER BY timestamp DESC LIMIT 100`;
  return NextResponse.json({ logs: rows });
}
