import { StoryAnswers, GeneratedStory, StoryChapter } from '@/types';
import { OPENAI_API_KEY } from '@/constants/Config';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

function buildPrompt(answers: StoryAnswers): string {
  return `Tu es un conteur africain bienveillant qui crée des histoires magiques pour les enfants de 5 à 12 ans.

Crée une histoire captivante en français avec ces éléments :
- Héros : ${answers.heroName}, un enfant ${answers.region.name.toLowerCase() === 'caraïbes' ? 'des Caraïbes' : answers.region.name.toLowerCase().startsWith('afrique') ? "d'" + answers.region.name : 'de ' + answers.region.name} (origine : ${answers.region.description})
- Qualité principale : ${answers.heroTrait}
- Lieu : ${answers.setting}
- Compagnon : ${answers.companion}
- Défi : ${answers.challenge}
- Objet magique : ${answers.power}
- Morale : ${answers.moral}

IMPORTANT :
- Le héros doit être fier de ses origines et de sa culture afro-descendante
- Intègre des éléments culturels authentiques de la région choisie (cuisine, musique, traditions, langues locales)
- L'histoire doit être positive, inspirante et valorisante
- Utilise un vocabulaire adapté aux enfants
- Ajoute des onomatopées et des expressions vivantes

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "title": "Titre de l'histoire",
  "chapters": [
    {
      "title": "Titre du chapitre 1",
      "text": "Texte du chapitre (3-4 paragraphes)",
      "illustration": "Description courte de l'illustration pour ce chapitre"
    },
    {
      "title": "Titre du chapitre 2",
      "text": "Texte du chapitre (3-4 paragraphes)",
      "illustration": "Description courte de l'illustration pour ce chapitre"
    },
    {
      "title": "Titre du chapitre 3",
      "text": "Texte du chapitre (3-4 paragraphes)",
      "illustration": "Description courte de l'illustration pour ce chapitre"
    },
    {
      "title": "Titre du chapitre 4 - Le dénouement",
      "text": "Texte du chapitre final avec la morale (3-4 paragraphes)",
      "illustration": "Description courte de l'illustration pour ce chapitre"
    }
  ]
}`;
}

function generateFallbackStory(answers: StoryAnswers): { title: string; chapters: StoryChapter[] } {
  const heroName = answers.heroName || 'Ayo';
  const regionName = answers.region?.name || "l'Afrique de l'Ouest";

  return {
    title: `${heroName} et le Secret des Ancêtres`,
    chapters: [
      {
        title: 'Le Début de l\'Aventure',
        text: `Il était une fois, dans ${answers.setting || 'un village enchanteur'}, un enfant extraordinaire nommé ${heroName}. Originaire ${regionName.startsWith('Afrique') ? "d'" + regionName : 'de ' + regionName}, ${heroName} portait dans son cœur ${answers.heroTrait || 'un courage immense'} qui le rendait unique parmi tous les enfants de son âge.\n\nChaque soir, sa grand-mère lui racontait des histoires fabuleuses sur leurs ancêtres, des hommes et des femmes si braves que même les étoiles s'inclinaient devant eux. "${heroName}, n'oublie jamais d'où tu viens", lui disait-elle en caressant ses cheveux. "Car tes racines sont ta plus grande force."\n\nUn matin pas comme les autres, alors que le soleil peignait le ciel de rouge et d'or, ${heroName} découvrit quelque chose d'extraordinaire : ${answers.power || 'un collier ancien et mystérieux'} était apparu devant sa porte, brillant d'une lumière dorée.`,
        illustration: `${heroName} découvre un objet magique devant sa porte au lever du soleil`,
      },
      {
        title: 'La Rencontre',
        text: `En touchant ${answers.power || "l'objet mystérieux"}, ${heroName} sentit une chaleur envahir tout son être. WHOOOOSH ! Une lumière éblouissante jaillit et devant ses yeux ébahis apparut ${answers.companion || 'un être magique et bienveillant'}.\n\n"Bonjour ${heroName} !", dit le compagnon d'une voix chaleureuse. "Je t'attendais depuis longtemps. Le monde a besoin de toi ! Tu dois ${answers.challenge || "accomplir une quête extraordinaire"}."\n\n${heroName} serra fort ${answers.power || "l'objet magique"} contre son cœur. La peur essaya de s'installer, mais ${answers.heroTrait || "son courage"} prit le dessus. "Je suis prêt", dit-il d'une voix ferme. Et ensemble, ils partirent vers l'aventure, portés par le vent et les mélodies anciennes de leurs ancêtres.`,
        illustration: `${heroName} rencontre son compagnon magique dans un éclat de lumière`,
      },
      {
        title: 'L\'Épreuve',
        text: `Le chemin n'était pas facile. Des obstacles se dressaient à chaque tournant : des rivières à traverser, des montagnes à escalader, des énigmes à résoudre. Mais ${heroName} ne se décourageait jamais.\n\nQuand le doute le saisissait, ${heroName} fermait les yeux et entendait la voix de sa grand-mère : "Souviens-toi de qui tu es. Tu portes en toi la force de mille ancêtres."\n\nBAOUM ! Face au moment le plus difficile, ${heroName} utilisa ${answers.power || "son artefact magique"} et toute la puissance de ${answers.heroTrait || "son don spécial"}. La lumière jaillit de son cœur, si pure et si forte que même les ombres reculèrent. ${answers.companion || "Son compagnon"} cria : "Tu es incroyable, ${heroName} ! Continue !"\n\nAvec détermination, ${heroName} repoussa les ténèbres et accomplit ce que personne ne croyait possible.`,
        illustration: `${heroName} affronte bravement une épreuve avec son objet magique qui brille`,
      },
      {
        title: 'La Victoire et la Sagesse',
        text: `${heroName} avait réussi ! ${answers.challenge ? answers.challenge.charAt(0).toUpperCase() + answers.challenge.slice(1) : "La quête"} était accompli(e), et le monde entier semblait respirer de joie. Les oiseaux chantaient, les fleurs s'ouvraient, et une douce brise portait les rires des enfants.\n\nTout le village se rassembla pour fêter le retour triomphal de ${heroName}. Sa grand-mère, les larmes aux yeux mais le sourire radieux, le prit dans ses bras. "Je suis si fière de toi, mon enfant."\n\nCe jour-là, ${heroName} comprit quelque chose d'important : ${answers.moral || "il faut toujours croire en soi"}. Cette leçon, il la garda dans son cœur pour toujours, et la transmit à son tour aux enfants qui venaient s'asseoir autour de lui pour écouter ses histoires.\n\nEt si tu tends bien l'oreille, peut-être entendras-tu toi aussi la voix de ${heroName}, te soufflant : "Toi aussi, tu es extraordinaire. N'oublie jamais." ✨`,
        illustration: `${heroName} fête sa victoire avec tout le village, entouré de joie et de lumière`,
      },
    ],
  };
}

export async function generateStory(
  answers: StoryAnswers,
  apiKey?: string
): Promise<GeneratedStory> {
  apiKey = apiKey || OPENAI_API_KEY;
  const colors = ['#FF8C42', '#6B4CE6', '#FF6B9D', '#10B981', '#00BCD4', '#FFD93D'];
  const coverColor = answers.region?.color || colors[Math.floor(Math.random() * colors.length)];
  const id = `story_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  let storyData: { title: string; chapters: StoryChapter[] };

  if (apiKey) {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: buildPrompt(answers) }],
          temperature: 0.85,
          max_tokens: 3000,
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          storyData = JSON.parse(jsonMatch[0]);
        } else {
          storyData = generateFallbackStory(answers);
        }
      } else {
        storyData = generateFallbackStory(answers);
      }
    } catch {
      storyData = generateFallbackStory(answers);
    }
  } else {
    storyData = generateFallbackStory(answers);
  }

  return {
    id,
    title: storyData.title,
    chapters: storyData.chapters,
    answers,
    createdAt: new Date().toISOString(),
    coverColor,
  };
}
