import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received request body:", body);

    const {
      messages, // For regular chat interactions
      subjectId, // Unique identifier for the subject
      taskType, // Task type (e.g., 'divergent' or 'convergent')
      telemetry, // Telemetry data
      transcript, // Full chat transcript (user and AI messages)
      taskResponses, // Responses to the task (e.g., AUT ideas or RAT answers)
      engagementMetrics, // Analytics (e.g., copy/paste info, chatbot usage)
      startTime, // Experiment start time
      endTime, // Experiment end time
      qualtricsId // Optional Qualtrics ID for tracking
    } = body;

    // Check if this is a regular chat message (has messages array) or task completion (has complete data)
    if (messages && Array.isArray(messages) && messages.length > 0) {
      // Regular chat interaction - get AI response
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: messages.map(msg => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content
          })),
          max_tokens: 500,
          temperature: 0.7,
        });

        const aiResponse = completion.choices[0]?.message;
        
        if (aiResponse) {
          const response = {
            role: aiResponse.role,
            content: aiResponse.content,
            timestamp: Date.now()
          };

          console.log("Returning AI response:", response);
          return NextResponse.json({ response });
        } else {
          throw new Error("No response from OpenAI");
        }
      } catch (aiError) {
        console.error("OpenAI API error:", aiError);
        return NextResponse.json({ 
          response: {
            role: "assistant",
            content: "I'm sorry, I'm having trouble responding right now. Please try again.",
            timestamp: Date.now()
          }
        });
      }
    } 
    
    // Task completion - log to database
    else if (subjectId && taskType && transcript && taskResponses && engagementMetrics && startTime && endTime) {
      // Validate required fields for task completion
      const requiredFields = ['subjectId', 'taskType', 'transcript', 'taskResponses', 'engagementMetrics', 'startTime', 'endTime'];
      const missingFields = requiredFields.filter(field => !body[field]);
      
      if (missingFields.length > 0) {
        console.log("Missing required fields for task completion:", missingFields);
        return NextResponse.json({ error: `Missing required fields: ${missingFields.join(", ")}` }, { status: 400 });
      }

      console.log("=== ATTEMPTING DATABASE INSERT ===");
      console.log("subjectId:", subjectId);
      console.log("taskType:", taskType);
      console.log("transcript length:", Array.isArray(transcript) ? transcript.length : 'not array');
      console.log("taskResponses:", taskResponses);
      console.log("engagementMetrics:", JSON.stringify(engagementMetrics, null, 2));
      console.log("startTime:", startTime);
      console.log("endTime:", endTime);
      console.log("qualtricsId:", qualtricsId);

      try {
        const result = await sql`
          INSERT INTO interactions (
            subject_id, task_type, transcript, task_responses, engagement_metrics, start_time, end_time, qualtrics_id
          ) VALUES (
            ${subjectId}, ${taskType}, ${JSON.stringify(transcript)}, ${JSON.stringify(taskResponses)}, ${JSON.stringify(engagementMetrics)}, ${startTime}, ${endTime}, ${qualtricsId}
          )
          RETURNING id
        `;

        console.log("=== DATABASE INSERT SUCCESS ===");
        console.log("Inserted row ID:", result.rows[0]?.id);
        
        return NextResponse.json({ 
          success: true,
          insertedId: result.rows[0]?.id,
          response: {
            role: "assistant",
            content: "Task completed successfully. Thank you for your participation!",
            timestamp: Date.now()
          }
        });
      } catch (dbError) {
        console.error("=== DATABASE ERROR ===");
        console.error("Error name:", (dbError as Error).name);
        console.error("Error message:", (dbError as Error).message);
        console.error("Full error:", dbError);
        return NextResponse.json({ error: "Failed to save interaction data", details: (dbError as Error).message }, { status: 500 });
      }
    } 
    
    // Invalid request
    else {
      console.log("=== INVALID REQUEST FORMAT ===");
      console.log("subjectId:", subjectId, "truthy:", !!subjectId);
      console.log("taskType:", taskType, "truthy:", !!taskType);
      console.log("transcript:", transcript, "truthy:", !!transcript);
      console.log("taskResponses:", taskResponses, "truthy:", !!taskResponses);
      console.log("engagementMetrics:", engagementMetrics, "truthy:", !!engagementMetrics);
      console.log("startTime:", startTime, "truthy:", !!startTime);
      console.log("endTime:", endTime, "truthy:", !!endTime);
      console.log("messages:", messages, "truthy:", !!messages);
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

  } catch (error) {
    console.error("General API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  // For admin: return all logs (protect in production)
  const { rows } = await sql`SELECT * FROM interactions ORDER BY timestamp DESC LIMIT 100`;
  return NextResponse.json({ logs: rows });
}
