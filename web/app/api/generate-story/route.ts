import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { answers, useAI } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!useAI || !apiKey) {
    return NextResponse.json({ fallback: true });
  }

  try {
    const prompt = `Tu es un conteur africain bienveillant qui crée des histoires magiques pour les enfants de 5 à 12 ans.

Crée une histoire captivante en français avec ces éléments :
- Héros : ${answers.heroName}, origine : ${answers.region?.name} (${answers.region?.description})
- Qualité principale : ${answers.heroTrait}
- Lieu : ${answers.setting}
- Compagnon : ${answers.companion}
- Défi : ${answers.challenge}
- Objet magique : ${answers.power}
- Morale : ${answers.moral}

IMPORTANT :
- Le héros doit être fier de ses origines et de sa culture afro-descendante
- Intègre des éléments culturels authentiques de la région choisie
- L'histoire doit être positive, inspirante et valorisante
- Utilise un vocabulaire adapté aux enfants
- Ajoute des onomatopées et des expressions vivantes

Réponds UNIQUEMENT en JSON valide :
{
  "title": "Titre",
  "chapters": [
    { "title": "Chapitre 1", "text": "Texte (3-4 paragraphes)", "illustration": "Description courte illustration" },
    { "title": "Chapitre 2", "text": "Texte", "illustration": "Description" },
    { "title": "Chapitre 3", "text": "Texte", "illustration": "Description" },
    { "title": "Chapitre 4 - Dénouement", "text": "Texte final avec morale", "illustration": "Description" }
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 3000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return NextResponse.json(JSON.parse(jsonMatch[0]));
      }
    }

    return NextResponse.json({ fallback: true });
  } catch {
    return NextResponse.json({ fallback: true });
  }
}
