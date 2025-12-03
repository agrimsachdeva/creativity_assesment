import { NextRequest, NextResponse } from "next/server";

// This endpoint simulates a full task completion to test database saving
export async function GET(req: NextRequest) {
  const baseUrl = req.nextUrl.origin;
  
  const testPayload = {
    subjectId: "test_session_" + Date.now(),
    taskType: "divergent",
    transcript: [
      { role: "user", content: "Give me ideas for a paperclip", timestamp: Date.now() - 60000 },
      { role: "assistant", content: "Here are some creative ideas...", timestamp: Date.now() - 55000 }
    ],
    taskResponses: ["Use as a bookmark", "Bend into a sculpture", "Use as a zipper pull"],
    engagementMetrics: {
      copyPasteCount: 2,
      chatbotUsagePercentage: 35,
      chatbotEngagementCount: 3,
      copyPasteEvents: [
        { timestamp: Date.now() - 30000, type: "copy", source: "chat", textLength: 45, textPreview: "Here are some creative ideas..." }
      ],
      aiUsageTracking: {
        aiResponsesCopied: 1,
        aiTextUsedInAnswers: 15,
        totalAiTextLength: 150,
        totalUserAnswerLength: 80,
        aiUsagePercentage: 18.75,
        matchedSegments: []
      }
    },
    startTime: new Date(Date.now() - 120000).toISOString(),
    endTime: new Date().toISOString(),
    qualtricsId: "test_qualtrics_123"
  };

  console.log("=== TEST TASK COMPLETION ===");
  console.log("Sending payload to /api/chat:", JSON.stringify(testPayload, null, 2));

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();
    console.log("Response:", data);

    return NextResponse.json({
      testPayload,
      apiResponse: data,
      status: response.status
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({
      error: (error as Error).message,
      testPayload
    }, { status: 500 });
  }
}
