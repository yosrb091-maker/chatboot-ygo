import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

// Adresse publique du site : sert à écrire des liens complets (icônes, aperçus).
// Sur Vercel elle est détectée automatiquement ; vous pouvez aussi définir NEXT_PUBLIC_SITE_URL.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

// Les icônes (favicon.ico, icon.png, apple-icon.png) sont dans src/app :
// Next.js les détecte seul et ajoute les balises <link> dans la page.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "YGO — Votre assistant intelligent",
  description:
    "Posez vos questions et imaginez vos prochaines aventures avec YGO, votre assistant intelligent créé par Yosr et Ghofran.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
