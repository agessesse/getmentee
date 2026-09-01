import { NextRequest, NextResponse } from 'next/server';

export interface SessionSummaryResult {
  summary: string;
  keyTakeaways: string[];
  actionItems: Array<{ assignee: string; item: string }>;
  topicsDiscussed: string[];
  followUp: string;
}

// POST /api/voice/summarize
// Accepts { transcript: string, mentorName: string, menteeName: string }.
// Returns a structured SessionSummaryResult.
// Requires OPENAI_API_KEY — returns 503 if absent.
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'Session intelligence is currently unavailable.' },
      { status: 503 }
    );
  }

  let body: { transcript?: string; mentorName?: string; menteeName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { transcript, mentorName = 'Mentor', menteeName = 'Mentee' } = body;

  if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 50) {
    return NextResponse.json(
      { error: 'Transcript is too short to summarize.' },
      { status: 400 }
    );
  }

  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = `You are a mentorship session intelligence assistant.
You receive a raw transcript from a mentorship conversation between ${mentorName} (mentor) and ${menteeName} (mentee).
Your job is to produce a structured session summary derived ONLY from the actual transcript content.

CRITICAL RULES:
- Do NOT invent information not present in the transcript.
- Do NOT fabricate action items, quotes, or takeaways.
- If the transcript is unclear or incomplete, say so in the summary.
- Be concise but specific — use names and concrete details from the conversation.

Return valid JSON matching this exact schema:
{
  "summary": "2-3 sentence overview of what was discussed",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
  "actionItems": [
    { "assignee": "${menteeName}", "item": "action item for mentee" },
    { "assignee": "${mentorName}", "item": "action item for mentor" }
  ],
  "topicsDiscussed": ["topic 1", "topic 2"],
  "followUp": "1 sentence suggestion for the next conversation based on what was discussed"
}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Session transcript:\n\n${transcript}` },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty response from model');

    const parsed: SessionSummaryResult = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[voice/summarize]', err);
    return NextResponse.json({ error: 'Failed to generate summary.' }, { status: 500 });
  }
}
