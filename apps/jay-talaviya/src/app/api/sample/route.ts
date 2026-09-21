import { NextResponse } from "next/server";
import { SAMPLE_AUDIO_URL, SAMPLE_INTELLIGENCE, SAMPLE_JOB_ID, SAMPLE_TRANSCRIPT } from "@/lib/sample-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    job_id: SAMPLE_JOB_ID,
    audio_url: SAMPLE_AUDIO_URL,
    transcript: SAMPLE_TRANSCRIPT,
    intelligence: SAMPLE_INTELLIGENCE,
  });
}
