import { NextRequest, NextResponse } from "next/server";
import { AirtableClient } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, summary, actionItems, keyTimestamps, audioLink, jobId } = body;

    if (!title || !summary || !jobId) {
      return NextResponse.json(
        { error: "Missing required fields (title, summary, or jobId)" },
        { status: 400 }
      );
    }

    const client = new AirtableClient();
    const record = await client.createRecord({
      "Title": title,
      "Summary": summary,
      "Action Items / Questions": actionItems || "No action items identified.",
      "Key Timestamps": keyTimestamps || "No timestamps identified.",
      "Audio Link": audioLink || undefined,
      "WhipScribe Job ID": jobId,
    });

    return NextResponse.json({
      success: true,
      record_id: record.id,
      base_url: client.getBaseUrl(),
      record,
    });
  } catch (err: unknown) {
    console.error("Airtable API Error:", err);
    const message = err instanceof Error ? err.message : "Failed to insert record into Airtable";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
