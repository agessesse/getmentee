import { NextRequest, NextResponse } from 'next/server';

// POST /api/voice/transcribe
// Accepts an audio blob (multipart/form-data, field: "audio"), returns { transcript: string }.
// Requires OPENAI_API_KEY. Returns 503 if the key is absent so the UI can degrade gracefully.
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'Voice transcription is currently unavailable.' },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const audioFile = formData.get('audio');
  if (!audioFile || !(audioFile instanceof Blob)) {
    return NextResponse.json({ error: 'Missing audio field.' }, { status: 400 });
  }

  // Enforce a reasonable size limit (25 MB is Whisper's max).
  if (audioFile.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'Audio file exceeds 25 MB limit.' }, { status: 413 });
  }

  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    // Whisper supports mp3, mp4, mpeg, mpga, m4a, wav, webm.
    // MediaRecorder typically outputs webm/ogg — pass filename with extension so Whisper detects format.
    const file = new File([audioFile], 'audio.webm', { type: audioFile.type || 'audio/webm' });

    const result = await client.audio.transcriptions.create({
      model: 'whisper-1',
      file,
      // Provide context vocabulary to improve recognition of domain-specific terms.
      prompt:
        'Kenan-Flagler, Bondway, Wells Fargo, Fixed Income, EBITDA, JPMorgan, Goldman Sachs, McKinsey, recruiting, mentee, mentor',
    });

    return NextResponse.json({ transcript: result.text });
  } catch (err) {
    console.error('[voice/transcribe]', err);
    return NextResponse.json({ error: 'Transcription failed. Please try again.' }, { status: 500 });
  }
}
