import type { Metadata } from "next";
import { League_Spartan, Karla } from "next/font/google";
import "./globals.css";

const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "PhotoMemory Vault",
  description:
    "Photographer Session Intelligence System: image critique, session history, semantic recall, and rubric scoring — powered by GPT-4o and Postgres/pgvector.",
  keywords: [
    "AI",
    "Photography",
    "Photo Critique",
    "Composition",
    "Lighting",
    "LangChain",
    "Postgres",
    "pgvector",
    "Next.js",
    "OpenAI",
    "GPT-4o",
  ],
  openGraph: {
    title: "PhotoMemory Vault",
    description:
      "Image critique with session history and semantic recall (pgvector).",
    url: "",
    siteName: "PhotoMemory Vault",
    images: [],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PhotoMemory Vault",
    description:
      "Photographer Session Intelligence System — GPT‑4o + Postgres/pgvector.",
    creator: "",
    images: [],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${leagueSpartan.variable} ${karla.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
