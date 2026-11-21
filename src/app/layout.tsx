import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
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
