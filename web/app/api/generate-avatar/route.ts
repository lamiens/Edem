import { NextRequest, NextResponse } from 'next/server';

const REGION_TRAITS: Record<string, string> = {
  'caribbean': 'curly hair, warm brown skin, joyful eyes',
  'west-africa': 'short natural hair, deep brown skin, radiant smile',
  'central-africa': 'coily hair, rich dark skin, expressive eyes',
  'east-africa': 'short hair, warm brown skin, high cheekbones',
  'usa': 'stylish afro, medium brown skin, confident look',
  'europe': 'curly hair, warm brown skin, curious eyes',
  'indian-ocean': 'wavy dark hair, golden brown skin, gentle smile',
  'brazil': 'curly dark hair, caramel skin, energetic expression',
};

export async function POST(req: NextRequest) {
  const { photoData, heroName, regionId } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  const traits = REGION_TRAITS[regionId] || 'natural hair, dark brown skin, warm smile';
  let description = `young Black child ${heroName} with ${traits}`;

  // Vision analysis if photo provided and API key available
  if (photoData && apiKey) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Describe this child briefly for an illustrator (1-2 sentences): hair, skin tone, face shape, features. English only.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${photoData}`, detail: 'low' } },
            ],
          }],
          max_tokens: 100,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const aiDesc = data.choices?.[0]?.message?.content;
        if (aiDesc) description = aiDesc;
      }
    } catch (e) {
      console.warn('Vision failed:', e);
    }
  }

  // Generate avatar with DALL-E
  if (apiKey) {
    try {
      const prompt = `Character portrait, cartoon Disney Pixar style. ${description}. Head and shoulders, front view, big bright eyes, warm smile, magical sparkles. Soft gradient background. No text. Safe for children.`;
      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'standard', style: 'vivid' }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const url = data?.data?.[0]?.url;
        if (url) return NextResponse.json({ url, description, source: 'dalle' });
      }
    } catch (e) {
      console.warn('DALL-E avatar failed:', e);
    }
  }

  // Fallback: Pollinations
  const shortPrompt = `cartoon character portrait, Disney Pixar style, ${description.slice(0, 150)}, head shoulders, big eyes, warm smile, sparkles, soft background, no text`;
  const encoded = encodeURIComponent(shortPrompt);
  const seed = Math.floor(Math.random() * 99999);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${seed}`;

  return NextResponse.json({ url, description, source: 'pollinations' });
}
