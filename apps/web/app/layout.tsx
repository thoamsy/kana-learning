import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";
import { AppNav } from "../src/components/app-nav";
import { GoeyToasterProvider } from "../src/components/goey-toaster-provider";

export const metadata: Metadata = {
  title: "Kana Trainer",
  description: "SRS-based kana trainer with emoji words",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <main id="main-content" className="container">
          <header className="app-header">
            <h1>
              <Link href="/" className="home-title-link" data-testid="home-title-link">
                Kana Trainer
              </Link>
            </h1>
            <p className="subtitle">Bidirectional kana drills with emoji vocabulary</p>
            <AppNav />
          </header>
          {children}
        </main>
        <GoeyToasterProvider />
      </body>
    </html>
  );
}
