import { NextRequest, NextResponse } from 'next/server';

const REGION_CONTEXT: Record<string, string> = {
  'caribbean': 'tropical Caribbean, turquoise sea',
  'west-africa': 'West African village, baobab trees',
  'central-africa': 'African rainforest, exotic flowers',
  'east-africa': 'African savanna, acacia trees',
  'usa': 'American urban setting',
  'europe': 'European cityscape',
  'indian-ocean': 'tropical island, lagoon',
  'brazil': 'colorful Brazilian setting',
};

export async function POST(req: NextRequest) {
  const { illustrationDesc, regionId, heroName, characterDescription, chapterIndex } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  const charDesc = characterDescription
    ? characterDescription.slice(0, 120)
    : `young Black child ${heroName} dark brown skin`;
  const region = REGION_CONTEXT[regionId] || 'magical setting';
  const scene = (illustrationDesc || '').slice(0, 100);

  // Try DALL-E
  if (apiKey) {
    try {
      const dallePrompt = `children book illustration, colorful cartoon, vibrant, warm, Disney Pixar African art. Scene: ${illustrationDesc}. Main character: ${charDesc}. Name: ${heroName}. Setting: ${region}. No text. Safe for children.`;

      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt: dallePrompt, n: 1, size: '1024x1024', quality: 'standard', style: 'vivid' }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const url = data?.data?.[0]?.url;
        if (url) return NextResponse.json({ url, source: 'dalle' });
      }
    } catch (e) {
      console.warn('DALL-E failed:', e);
    }
  }

  // Fallback: Pollinations
  const shortPrompt = `children book cartoon, ${scene}, character: ${charDesc}, ${region}, vibrant, no text`;
  const encoded = encodeURIComponent(shortPrompt.slice(0, 400));
  const seed = Math.floor(Math.random() * 99999);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=768&height=768&nologo=true&seed=${seed}`;

  return NextResponse.json({ url: pollinationsUrl, source: 'pollinations' });
}
