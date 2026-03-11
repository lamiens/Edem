'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { getStory } from '@/lib/storage';
import { GeneratedStory } from '@/lib/types';

const GRADIENTS = [
  'from-orange-400 to-yellow-400',
  'from-violet-500 to-blue-400',
  'from-emerald-500 to-green-400',
  'from-pink-500 to-orange-400',
];

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const s = getStory(id);
    if (s) setStory(s);
    else router.push('/library');
  }, [id, router]);

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  const totalPages = story ? story.chapters.length + 2 : 0;

  const playChapterAudio = async (chapterIdx: number) => {
    if (!story || loadingAudio) return;
    audioRef.current?.pause();

    const chapter = story.chapters[chapterIdx];
    const text = `${chapter.title}. ${chapter.text}`;

    setLoadingAudio(true);
    setIsPlaying(true);

    try {
      const resp = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (resp.ok) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setIsPlaying(false); };
        audio.onerror = () => { setIsPlaying(false); };
        audio.play();
      } else {
        setIsPlaying(false);
      }
    } catch {
      setIsPlaying(false);
    }
    setLoadingAudio(false);
  };

  const stopAudio = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="text-5xl animate-float mb-4">📖</div>
          <p className="text-[var(--color-text-secondary)] font-semibold">Ouverture du livre...</p>
        </div>
      </div>
    );
  }

  const chapterIdx = currentPage - 1;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-black/5 sticky top-0 z-20">
        <button onClick={() => router.push('/')} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">🏠</button>
        <div className="flex gap-1.5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => { stopAudio(); setCurrentPage(i); }}
              className="h-2 rounded-full transition-all cursor-pointer"
              style={{
                width: i === currentPage ? 24 : 8,
                backgroundColor: i === currentPage ? story.coverColor : '#e5e7eb',
              }}
            />
          ))}
        </div>
        <button onClick={() => router.push('/library')} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">📚</button>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full">

        {/* COVER */}
        {currentPage === 0 && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-12 text-center" style={{ background: `linear-gradient(180deg, ${story.coverColor}, ${story.coverColor}BB, #2D1B0E)` }}>
            <p className="text-white/50 text-xs font-bold tracking-[0.2em] uppercase mb-8">Un livre Edem</p>

            {story.avatarUrl ? (
              <div className="relative mb-6">
                <img src={story.avatarUrl} alt="Avatar" className="w-32 h-32 rounded-full border-4 border-white/40 shadow-2xl object-cover" />
                {story.answers.photoData && (
                  <img src={`data:image/jpeg;base64,${story.answers.photoData}`} alt="Photo" className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full border-2 border-white shadow-lg object-cover" />
                )}
              </div>
            ) : story.answers.photoData ? (
              <img src={`data:image/jpeg;base64,${story.answers.photoData}`} alt="Photo" className="w-28 h-28 rounded-full border-4 border-white/40 shadow-2xl mb-6 object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/15 flex items-center justify-center mb-6"><span className="text-5xl">📖</span></div>
            )}

            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">{story.title}</h1>
            <p className="text-white/70 text-base mb-1">{story.answers.region?.emoji} {story.answers.region?.name}</p>
            <p className="text-white/50 text-sm mb-10">Avec {story.answers.heroName} comme héros</p>

            <button
              onClick={() => setCurrentPage(1)}
              className="gradient-golden px-10 py-4 rounded-2xl font-extrabold text-lg text-[#2D1B0E] shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all"
            >
              📖 Lire l&apos;histoire
            </button>

            <p className="text-white/30 text-sm mt-8">Ou utilise les boutons ← → pour naviguer</p>
          </div>
        )}

        {/* CHAPTERS */}
        {currentPage > 0 && currentPage <= story.chapters.length && (
          <div className="px-4 py-6 space-y-5">
            {/* Chapter banner */}
            <div className={`bg-gradient-to-r ${GRADIENTS[chapterIdx % GRADIENTS.length]} rounded-2xl p-5 text-center shadow-lg`}>
              <p className="text-white/70 text-xs font-bold tracking-widest uppercase">Chapitre {chapterIdx + 1}</p>
              <h2 className="text-xl font-extrabold text-white mt-1">{story.chapters[chapterIdx].title}</h2>
            </div>

            {/* Illustration */}
            <div className="rounded-2xl overflow-hidden border-[3px] border-[#2D1B0E] shadow-xl bg-gray-100 aspect-square max-h-[400px]">
              {story.chapters[chapterIdx].imageUrl ? (
                <img
                  src={story.chapters[chapterIdx].imageUrl}
                  alt={story.chapters[chapterIdx].illustration}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-orange-50">
                  <span className="text-5xl mb-3">🎨</span>
                  <p className="text-orange-400 text-sm italic text-center">{story.chapters[chapterIdx].illustration}</p>
                </div>
              )}
            </div>

            {/* Hero badge on first chapter */}
            {chapterIdx === 0 && (story.avatarUrl || story.answers.photoData) && (
              <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow border-2 border-yellow-200">
                {story.avatarUrl ? (
                  <img src={story.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-yellow-400 object-cover" />
                ) : story.answers.photoData ? (
                  <img src={`data:image/jpeg;base64,${story.answers.photoData}`} alt="Photo" className="w-12 h-12 rounded-full object-cover" />
                ) : null}
                <div>
                  <p className="font-extrabold text-sm">{story.answers.heroName}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{story.avatarUrl ? 'Version cartoon du héros' : 'Le héros de cette histoire'}</p>
                </div>
              </div>
            )}

            {/* Story text */}
            {story.chapters[chapterIdx].text.split('\n\n').filter(Boolean).map((paragraph, pIdx) => (
              <div key={pIdx} className="bg-white rounded-2xl p-5 shadow-sm border-l-4" style={{ borderLeftColor: story.coverColor }}>
                <p className="text-base leading-7 text-[var(--color-text)]">
                  {pIdx === 0 && <span className="text-4xl font-black float-left mr-2 leading-none" style={{ color: story.coverColor }}>{paragraph.charAt(0)}</span>}
                  {pIdx === 0 ? paragraph.slice(1) : paragraph}
                </p>
              </div>
            ))}

            {/* Page number */}
            <div className="flex justify-center">
              <span className="w-8 h-8 rounded-full bg-[var(--color-text)] text-white text-xs font-extrabold flex items-center justify-center">{chapterIdx + 1}</span>
            </div>
          </div>
        )}

        {/* END PAGE */}
        {currentPage === totalPages - 1 && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="text-6xl mb-4">🌟</div>
            <h2 className="text-4xl font-black mb-4">Fin</h2>
            <p className="text-xl italic text-[var(--color-secondary)] font-semibold mb-12">
              &laquo; {story.answers.moral} &raquo;
            </p>
            <div className="w-full max-w-xs space-y-3">
              <button onClick={() => router.push('/create')} className="w-full gradient-golden py-4 rounded-2xl font-extrabold text-base text-[#2D1B0E] shadow-lg hover:shadow-xl transition">
                📖 Nouvelle histoire
              </button>
              <button onClick={() => router.push('/')} className="w-full py-4 rounded-2xl bg-white border-2 border-[var(--color-secondary)]/30 text-[var(--color-secondary)] font-bold hover:bg-violet-50 transition">
                🏠 Accueil
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation + Audio bar */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-black/5 px-4 py-3 flex items-center justify-between gap-3 max-w-2xl mx-auto w-full">
        <button
          onClick={() => { stopAudio(); setCurrentPage((p) => Math.max(0, p - 1)); }}
          disabled={currentPage === 0}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold disabled:opacity-30 hover:bg-gray-200 transition"
        >
          ←
        </button>

        {currentPage > 0 && currentPage <= story.chapters.length ? (
          isPlaying ? (
            <button onClick={stopAudio} className="flex-1 py-3 rounded-2xl bg-red-100 text-red-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-200 transition">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Arrêter
            </button>
          ) : (
            <button
              onClick={() => playChapterAudio(chapterIdx)}
              disabled={loadingAudio}
              className="flex-1 py-3 rounded-2xl bg-[var(--color-secondary)] text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {loadingAudio ? '⏳ Chargement...' : '🔊 Écouter ce chapitre'}
            </button>
          )
        ) : (
          <div className="flex-1" />
        )}

        <button
          onClick={() => { stopAudio(); setCurrentPage((p) => Math.min(totalPages - 1, p + 1)); }}
          disabled={currentPage === totalPages - 1}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold disabled:opacity-30 hover:bg-gray-200 transition"
        >
          →
        </button>
      </div>
    </div>
  );
}
