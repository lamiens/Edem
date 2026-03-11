'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { regions, storyQuestions } from '@/lib/data';
import { Region, StoryAnswers, GeneratedStory, StoryChapter } from '@/lib/types';
import { saveStory, canUseAI, incrementStoriesCreated } from '@/lib/storage';

type Step = 'photo' | 'region' | 'questions' | 'loading';

function generateFallbackStory(answers: StoryAnswers): { title: string; chapters: StoryChapter[] } {
  const h = answers.heroName || 'Ayo';
  const r = answers.region?.name || "l'Afrique";
  return {
    title: `${h} et le Secret des Ancêtres`,
    chapters: [
      {
        title: "Le Début de l'Aventure",
        text: `Il était une fois, dans ${answers.setting || 'un village enchanteur'}, un enfant extraordinaire nommé ${h}. Originaire de ${r}, ${h} portait dans son cœur ${answers.heroTrait || 'un courage immense'} qui le rendait unique.\n\nChaque soir, sa grand-mère lui racontait des histoires fabuleuses sur leurs ancêtres. "${h}, n'oublie jamais d'où tu viens", lui disait-elle.\n\nUn matin, ${h} découvrit ${answers.power || 'un objet mystérieux'} devant sa porte, brillant d'une lumière dorée.`,
        illustration: `${h} découvre un objet magique au lever du soleil`,
      },
      {
        title: 'La Rencontre',
        text: `En touchant ${answers.power || "l'objet"}, ${h} sentit une chaleur envahir tout son être. WHOOOOSH ! Une lumière jaillit et apparut ${answers.companion || 'un être magique'}.\n\n"Bonjour ${h} ! Je t'attendais. Tu dois ${answers.challenge || 'accomplir une quête extraordinaire'}."\n\n${h} serra fort l'objet contre son cœur. "Je suis prêt", dit-il d'une voix ferme.`,
        illustration: `${h} rencontre son compagnon magique`,
      },
      {
        title: "L'Épreuve",
        text: `Le chemin n'était pas facile. Des obstacles se dressaient à chaque tournant. Mais ${h} ne se décourageait jamais.\n\nQuand le doute le saisissait, ${h} entendait la voix de sa grand-mère : "Souviens-toi de qui tu es."\n\nBAOUM ! Face au moment le plus difficile, ${h} utilisa ${answers.power || 'son artefact'} et toute la puissance de ${answers.heroTrait || 'son don'}. La lumière jaillit de son cœur !`,
        illustration: `${h} affronte bravement une épreuve`,
      },
      {
        title: 'La Victoire et la Sagesse',
        text: `${h} avait réussi ! Le monde entier semblait respirer de joie. Les oiseaux chantaient, les fleurs s'ouvraient.\n\nTout le village fêta son retour. Sa grand-mère, les larmes aux yeux, le prit dans ses bras. "Je suis si fière de toi."\n\nCe jour-là, ${h} comprit : ${answers.moral || 'il faut toujours croire en soi'}. Et si tu tends bien l'oreille, tu entendras ${h} te souffler : "Toi aussi, tu es extraordinaire."`,
        illustration: `${h} fête sa victoire avec tout le village`,
      },
    ],
  };
}

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('photo');
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingMsg, setLoadingMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 640 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      alert('Impossible d\'accéder à la caméra. Utilisez le bouton "Choisir une photo" à la place.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const v = videoRef.current;
    const size = Math.min(v.videoWidth, v.videoHeight);
    const sx = (v.videoWidth - size) / 2;
    const sy = (v.videoHeight - size) / 2;
    ctx.drawImage(v, sx, sy, size, size, 0, 0, 512, 512);
    setPhotoPreview(canvas.toDataURL('image/jpeg', 0.8));
    setPhotoData(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
    stopCamera();
  }, [stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d')!;
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 512, 512);
        setPhotoPreview(canvas.toDataURL('image/jpeg', 0.8));
        setPhotoData(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (questionIndex < storyQuestions.length - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      setStep('loading');
      generateStory({ ...answers, [questionId]: value });
    }
  };

  const generateStory = async (finalAnswers: Record<string, string>) => {
    const useAI = canUseAI();
    const storyAnswers: StoryAnswers = {
      heroName: finalAnswers.heroName || 'Ayo',
      region: selectedRegion || regions[0],
      heroTrait: finalAnswers.heroTrait || 'le courage',
      setting: finalAnswers.setting || 'une forêt enchantée',
      companion: finalAnswers.companion || 'un chat magique',
      challenge: finalAnswers.challenge || 'retrouver un trésor perdu',
      power: finalAnswers.power || 'un collier ancestral',
      moral: finalAnswers.moral || 'Croire en soi',
      photoData: photoData || undefined,
    };

    const id = `story_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const colors = ['#FF8C42', '#6B4CE6', '#FF6B9D', '#10B981', '#00BCD4', '#FFD93D'];
    const coverColor = selectedRegion?.color || colors[Math.floor(Math.random() * colors.length)];

    try {
      // Step 1: Generate text
      setLoadingMsg(useAI ? "L'IA écrit ton histoire..." : "Écriture de l'histoire...");
      setProgress(15);

      let storyData: { title: string; chapters: StoryChapter[] };
      try {
        const resp = await fetch('/api/generate-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: storyAnswers, useAI }),
        });
        const data = await resp.json();
        storyData = data.fallback ? generateFallbackStory(storyAnswers) : data;
      } catch {
        storyData = generateFallbackStory(storyAnswers);
      }

      if (useAI) incrementStoriesCreated();

      // Step 2: Avatar
      setLoadingMsg('Transformation en personnage...');
      setProgress(30);

      let avatarUrl: string | undefined;
      let characterDescription = '';
      try {
        const resp = await fetch('/api/generate-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoData, heroName: storyAnswers.heroName, regionId: selectedRegion?.id }),
        });
        const data = await resp.json();
        avatarUrl = data.url;
        characterDescription = data.description || '';
      } catch {}

      // Step 3: Illustrations
      for (let i = 0; i < storyData.chapters.length; i++) {
        setLoadingMsg(`Illustration ${i + 1}/${storyData.chapters.length}...`);
        setProgress(40 + (i / storyData.chapters.length) * 50);

        try {
          const resp = await fetch('/api/generate-illustration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              illustrationDesc: storyData.chapters[i].illustration,
              regionId: selectedRegion?.id,
              heroName: storyAnswers.heroName,
              characterDescription,
              chapterIndex: i,
            }),
          });
          const data = await resp.json();
          storyData.chapters[i].imageUrl = data.url;
        } catch {}
      }

      setLoadingMsg('Finalisation...');
      setProgress(95);

      const story: GeneratedStory = {
        id,
        title: storyData.title,
        chapters: storyData.chapters,
        answers: storyAnswers,
        createdAt: new Date().toISOString(),
        coverColor,
        avatarUrl,
        characterDescription,
      };

      saveStory(story);
      router.push(`/story/${id}`);
    } catch (err) {
      console.error('Generation failed:', err);
      alert('Erreur lors de la génération. Réessaye !');
      setStep('photo');
    }
  };

  // ============ RENDER ============

  if (step === 'loading') {
    return (
      <div className="min-h-screen gradient-night flex flex-col items-center justify-center px-6">
        <div className="text-6xl animate-float mb-8">✨</div>
        <h2 className="text-2xl font-extrabold text-white mb-4 text-center">{loadingMsg}</h2>
        <div className="w-64 h-3 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full gradient-golden rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-white/40 text-sm mt-4">La magie opère...</p>
      </div>
    );
  }

  if (step === 'photo') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
        <header className="flex items-center justify-between p-4">
          <button onClick={() => router.push('/')} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-lg">←</button>
          <h1 className="font-extrabold text-lg">Ta photo</h1>
          <div className="w-10" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
          <p className="text-[var(--color-text-secondary)] text-center mb-6">Prends-toi en photo pour devenir le héros !</p>

          {photoPreview ? (
            <div className="relative mb-6">
              <img src={photoPreview} alt="Photo" className="w-48 h-48 rounded-full object-cover border-4 border-[var(--color-primary)] shadow-xl" />
              <button onClick={() => { setPhotoPreview(null); setPhotoData(null); }} className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center text-lg shadow-lg">×</button>
            </div>
          ) : cameraActive ? (
            <div className="relative mb-6">
              <video ref={videoRef} className="w-64 h-64 rounded-3xl object-cover bg-black" autoPlay playsInline muted />
              <button onClick={capturePhoto} className="absolute bottom-3 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white border-4 border-[var(--color-primary)] shadow-lg hover:scale-105 transition" />
            </div>
          ) : (
            <div className="w-48 h-48 rounded-full bg-white border-4 border-dashed border-[var(--color-text-muted)] flex items-center justify-center mb-6">
              <span className="text-5xl">📸</span>
            </div>
          )}

          <div className="w-full max-w-xs space-y-3">
            {!cameraActive && !photoPreview && (
              <>
                <button onClick={startCamera} className="w-full py-3.5 rounded-2xl gradient-sunset text-white font-bold text-base shadow-lg hover:shadow-xl transition">
                  📷 Prendre un selfie
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-3.5 rounded-2xl bg-white border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-bold text-base hover:bg-orange-50 transition">
                  🖼️ Choisir une photo
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </>
            )}

            <button
              onClick={() => { stopCamera(); setStep('region'); }}
              className="w-full py-3.5 rounded-2xl gradient-golden text-[#2D1B0E] font-extrabold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              {photoPreview ? 'Continuer →' : 'Passer cette étape →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'region') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
        <header className="flex items-center justify-between p-4">
          <button onClick={() => setStep('photo')} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-lg">←</button>
          <h1 className="font-extrabold text-lg">Choisis l'origine</h1>
          <div className="w-10" />
        </header>

        <div className="flex-1 px-4 pb-8">
          <p className="text-[var(--color-text-secondary)] text-center mb-6">D'où vient ton héros ?</p>
          <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
            {regions.map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelectedRegion(r); setStep('questions'); }}
                className="p-4 rounded-2xl bg-white shadow-md hover:shadow-xl hover:scale-[1.03] transition-all border-2 text-left"
                style={{ borderColor: r.color + '40' }}
              >
                <div className="text-3xl mb-2">{r.emoji}</div>
                <div className="font-bold text-sm" style={{ color: r.color }}>{r.name}</div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{r.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Questions step
  const currentQuestion = storyQuestions[questionIndex];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <header className="flex items-center justify-between p-4">
        <button onClick={() => questionIndex > 0 ? setQuestionIndex((i) => i - 1) : setStep('region')} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-lg">←</button>
        <div className="flex gap-1.5">
          {storyQuestions.map((_, i) => (
            <div key={i} className="w-8 h-1.5 rounded-full transition-all" style={{ backgroundColor: i <= questionIndex ? 'var(--color-primary)' : '#e5e7eb' }} />
          ))}
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <h2 className="text-2xl font-extrabold text-center mb-2">{currentQuestion.question}</h2>
        {currentQuestion.subtitle && <p className="text-[var(--color-text-secondary)] text-center mb-8">{currentQuestion.subtitle}</p>}

        {currentQuestion.type === 'text' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = (e.currentTarget.elements.namedItem('answer') as HTMLInputElement).value.trim();
              if (val) handleAnswer(currentQuestion.id, val);
            }}
            className="w-full max-w-sm"
          >
            <input
              name="answer"
              type="text"
              placeholder="Écris ici..."
              autoFocus
              className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-[var(--color-primary)] text-lg font-bold text-center outline-none focus:ring-4 focus:ring-[var(--color-primary)]/20 shadow"
              maxLength={30}
            />
            <button type="submit" className="w-full mt-4 py-3.5 rounded-2xl gradient-golden text-[#2D1B0E] font-extrabold text-base shadow-lg hover:shadow-xl transition">
              Continuer →
            </button>
          </form>
        ) : (
          <div className="w-full max-w-md grid grid-cols-2 gap-3">
            {currentQuestion.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleAnswer(currentQuestion.id, choice.value)}
                className="p-4 rounded-2xl bg-white shadow-md hover:shadow-xl hover:scale-[1.03] transition-all border-2 border-transparent hover:border-[var(--color-primary)] text-left"
              >
                <div className="text-2xl mb-2">{choice.emoji}</div>
                <div className="font-bold text-sm">{choice.label}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
