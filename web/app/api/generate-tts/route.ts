import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  // Try OpenAI TTS
  if (apiKey) {
    try {
      const resp = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'tts-1', input: text.slice(0, 4096), voice: 'nova', response_format: 'mp3', speed: 0.95 }),
      });

      if (resp.ok) {
        const buffer = await resp.arrayBuffer();
        return new NextResponse(buffer, {
          headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' },
        });
      }
    } catch (e) {
      console.warn('OpenAI TTS failed:', e);
    }
  }

  // Fallback: Google Translate TTS
  const cleanText = text.replace(/\n+/g, '. ').replace(/\s+/g, ' ').trim().slice(0, 200);
  const encoded = encodeURIComponent(cleanText);
  const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=fr&client=tw-ob&q=${encoded}`;

  try {
    const resp = await fetch(googleUrl);
    if (resp.ok) {
      const buffer = await resp.arrayBuffer();
      return new NextResponse(buffer, {
        headers: { 'Content-Type': 'audio/mpeg' },
      });
    }
  } catch (e) {
    console.warn('Google TTS failed:', e);
  }

  return NextResponse.json({ error: 'TTS unavailable' }, { status: 503 });
}
