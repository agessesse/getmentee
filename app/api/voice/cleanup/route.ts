import { NextRequest, NextResponse } from 'next/server';

// POST /api/voice/cleanup
// Accepts { text: string, context?: 'message' | 'note' | 'goal' | 'search' }.
// Returns { cleaned: string }.
// Applies light cleanup: punctuation, filler-word removal, capitalization.
// Requires OPENAI_API_KEY — returns 503 if absent so the UI degrades to raw transcript.
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  let body: { text?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { text, context = 'message' } = body;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'Missing text.' }, { status: 400 });
  }

  // Enforce length limit — cleanup is for short dictation, not long transcripts.
  if (text.length > 4000) {
    return NextResponse.json({ error: 'Text too long for cleanup.' }, { status: 413 });
  }

  const contextInstructions: Record<string, string> = {
    message: 'It is a conversational message to a mentor or mentee.',
    note: 'It is a personal note or reflection after a mentorship session.',
    goal: 'It is a goal statement for a mentorship profile.',
    search: 'It is a brief search query — keep it short and direct.',
  };

  const contextNote = contextInstructions[context] ?? contextInstructions.message;

  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 512,
      messages: [
        {
          role: 'system',
          content: [
            'You are a transcription cleanup assistant for a mentorship platform.',
            'The user has dictated text and you must lightly clean it.',
            'Rules:',
            '- Add correct punctuation and capitalization.',
            '- Remove filler words (um, uh, like when clearly unnecessary).',
            '- Recognize spoken formatting commands: "new paragraph" → paragraph break, "bullet point" → "•", "next line" → line break.',
            '- Do NOT change meaning, add content, or alter names and proper nouns.',
            '- Do NOT be creative or verbose — output only the cleaned version of the input.',
            '- Preserve the user\'s natural voice and tone.',
            contextNote,
          ].join('\n'),
        },
        {
          role: 'user',
          content: text,
        },
      ],
    });

    const cleaned = response.choices[0]?.message?.content?.trim() ?? text;
    return NextResponse.json({ cleaned });
  } catch (err) {
    console.error('[voice/cleanup]', err);
    // Return the original text — never silently drop dictation.
    return NextResponse.json({ cleaned: text });
  }
}
