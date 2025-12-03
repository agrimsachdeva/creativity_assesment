import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(req: NextRequest) {
  try {
    console.log("=== TEST DB CONNECTION ===");
    
    // Test 1: Check if we can connect
    const result = await sql`SELECT NOW() as current_time`;
    console.log("Database connected! Current time:", result.rows[0]);

    // Test 2: Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'interactions'
      ) as table_exists
    `;
    console.log("Table exists:", tableCheck.rows[0].table_exists);

    // Test 3: Count existing rows
    let rowCount = 0;
    if (tableCheck.rows[0].table_exists) {
      const countResult = await sql`SELECT COUNT(*) as count FROM interactions`;
      rowCount = countResult.rows[0].count;
      console.log("Row count:", rowCount);
    }

    // Test 4: Try inserting a test row
    const testInsert = await sql`
      INSERT INTO interactions (
        subject_id, task_type, transcript, task_responses, engagement_metrics, start_time, end_time, qualtrics_id
      ) VALUES (
        'test_subject_123', 
        'divergent', 
        ${JSON.stringify([{role: "user", content: "test message"}])}, 
        ${JSON.stringify(["test response 1", "test response 2"])}, 
        ${JSON.stringify({copyPasteCount: 5, chatbotUsagePercentage: 25})}, 
        '2025-12-03T10:00:00.000Z', 
        '2025-12-03T10:30:00.000Z', 
        null
      )
      RETURNING id
    `;
    console.log("Test insert successful! ID:", testInsert.rows[0].id);

    return NextResponse.json({ 
      success: true,
      dbTime: result.rows[0].current_time,
      tableExists: tableCheck.rows[0].table_exists,
      rowCount: rowCount,
      testInsertId: testInsert.rows[0].id
    });
  } catch (error) {
    console.error("=== TEST DB ERROR ===");
    console.error("Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
