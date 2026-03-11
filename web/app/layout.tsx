import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Edem - Crée tes histoires magiques',
  description: 'Application de création d\'histoires pour enfants avec des héros afro-descendants. Personnalise ton aventure avec l\'IA !',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
