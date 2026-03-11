'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStories, deleteStory } from '@/lib/storage';
import { GeneratedStory } from '@/lib/types';

export default function LibraryPage() {
  const router = useRouter();
  const [stories, setStories] = useState<GeneratedStory[]>([]);

  useEffect(() => {
    setStories(getStories());
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cette histoire ?')) {
      deleteStory(id);
      setStories(getStories());
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-black/5 sticky top-0 z-10">
        <button onClick={() => router.push('/')} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-lg">←</button>
        <h1 className="font-extrabold text-lg">Mes histoires</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {stories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-bold mb-2">Pas encore d&apos;histoires</h2>
            <p className="text-[var(--color-text-secondary)] mb-8">Crée ta première histoire magique !</p>
            <button
              onClick={() => router.push('/create')}
              className="gradient-golden px-8 py-4 rounded-2xl font-extrabold text-base text-[#2D1B0E] shadow-lg hover:shadow-xl transition"
            >
              📖 Créer une histoire
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => router.push(`/story/${story.id}`)}
              >
                <div className="flex">
                  {/* Color bar */}
                  <div className="w-2 shrink-0" style={{ backgroundColor: story.coverColor }} />

                  {/* Cover image / avatar */}
                  <div className="w-20 h-20 shrink-0 bg-gray-100 flex items-center justify-center">
                    {story.avatarUrl ? (
                      <img src={story.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : story.chapters[0]?.imageUrl ? (
                      <img src={story.chapters[0].imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">📖</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-3 min-w-0">
                    <h3 className="font-extrabold text-sm truncate group-hover:text-[var(--color-primary)] transition-colors">
                      {story.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {story.answers.region?.emoji} {story.answers.region?.name} &middot; {story.chapters.length} chapitres
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {new Date(story.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(story.id); }}
                    className="px-3 flex items-center text-gray-300 hover:text-red-500 transition-colors"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
