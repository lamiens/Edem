'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFreeStoriesLeft } from '@/lib/storage';

const FLOATING_EMOJIS = ['📚', '✨', '🌍', '🦁', '🏝️', '🎭', '⭐', '🌟'];

export default function HomePage() {
  const [freeLeft, setFreeLeft] = useState(2);

  useEffect(() => {
    setFreeLeft(getFreeStoriesLeft());
  }, []);

  return (
    <div className="min-h-screen gradient-night relative overflow-hidden">
      {/* Floating emojis */}
      <div className="absolute inset-0 pointer-events-none">
        {FLOATING_EMOJIS.map((emoji, i) => (
          <span
            key={i}
            className="absolute text-2xl opacity-20 animate-float"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-float">📚</div>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">Edem</h1>
          <p className="text-lg text-white/70 mt-3 font-medium">
            Crée tes propres histoires magiques !
          </p>
        </div>

        {/* Hero text */}
        <div className="text-center mb-10 max-w-md">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
            Deviens le héros<br />de ton histoire
          </h2>
          <p className="text-white/60 mt-4 leading-relaxed">
            Réponds aux questions, prends-toi en photo<br />et laisse la magie opérer !
          </p>
        </div>

        {/* CTA buttons */}
        <div className="w-full max-w-sm space-y-4">
          <Link
            href="/create"
            className="block w-full gradient-golden text-center py-5 px-8 rounded-2xl font-extrabold text-xl text-[#2D1B0E] shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-200"
          >
            <span className="text-2xl mr-2">📖</span>
            Créer une histoire
          </Link>

          {/* Credits badge */}
          <div className="text-center py-2">
            {freeLeft > 0 ? (
              <p className="text-[#FFD93D] text-sm font-semibold flex items-center justify-center gap-1.5">
                <span>✨</span>
                {freeLeft} histoire{freeLeft > 1 ? 's' : ''} IA gratuite{freeLeft > 1 ? 's' : ''} restante{freeLeft > 1 ? 's' : ''}
              </p>
            ) : (
              <p className="text-white/40 text-sm font-medium">
                Mode gratuit illimité
              </p>
            )}
          </div>

          <Link
            href="/library"
            className="flex items-center justify-center gap-3 w-full py-4 px-8 rounded-2xl bg-white/15 border-2 border-white/20 text-white font-bold text-lg hover:bg-white/25 transition-all duration-200"
          >
            <span>📚</span>
            Mes histoires
          </Link>
        </div>

        {/* Bottom text */}
        <p className="text-white/30 text-sm mt-12 font-medium">
          Des héros qui te ressemblent 🌟
        </p>
      </div>
    </div>
  );
}
