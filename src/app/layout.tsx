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
  title: "AI Photo Critique",
  description:
    "An open-source AI tool that provides expert photography critiques using GPT-4o and a RAG system. Explore the project built with Next.js, LangChain, and Pinecone.",
  keywords: [
    "AI",
    "Photography",
    "Photo Critique",
    "Composition",
    "Lighting",
    "LangChain",
    "RAG",
    "Portfolio",
    "Reinaldo Simoes",
    "Next.js",
    "OpenAI",
    "GPT-4o",
  ],
  authors: [{ name: "Reinaldo Simoes", url: "https://reinaldo.pt" }],
  creator: "Reinaldo Simoes",
  openGraph: {
    title: "AI Photo Critique",
    description:
      "I built an AI tool that gives expert feedback on photo composition and lighting. Check out the live demo and the open-source code.",
    url: "https://photo-critic.reinaldo.pt",
    siteName: "Reinaldo Simoes | Portfolio",
    images: [
      {
        url: "https://www.reinaldo.pt/og-image-photo-critic.png",
        width: 1200,
        height: 630,
        alt: "A preview of the AI Photo Critique application interface.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Photo Critique",
    description:
      "An open-source AI tool that provides expert photography critiques using GPT-4o, LangChain, and a RAG system.",
    creator: "@your_twitter_handle",
    images: ["https://www.reinaldo.pt/twitter-image-photo-critic.png"],
  },
  alternates: {
    canonical: "https://photo-critic.reinaldo.pt",
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
