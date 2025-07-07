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
  // Main SEO Title - Appears in browser tabs and search results
  title: "AI Photo Critique & Advisor | A Project by Reinaldo Simoes",

  // SEO Description - A concise summary for search engine results (around 160 characters)
  description:
    "An open-source AI tool that provides expert photography critiques using GPT-4o and a RAG system. Explore the project built with Next.js, LangChain, and Pinecone.",

  // Keywords for search engines to understand the page content
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

  // Information about the author
  authors: [{ name: "Reinaldo Simoes", url: "https://reinaldo.pt" }],
  creator: "Reinaldo Simoes",

  // --- Open Graph (og) metadata for social media sharing (Facebook, LinkedIn, etc.) ---
  openGraph: {
    title: "AI Photo Critique & Advisor",
    description:
      "I built an AI tool that gives expert feedback on photo composition and lighting. Check out the live demo and the open-source code.",
    url: "https://photo-critic.reinaldo.pt", // Replace with your final deployed URL
    siteName: "Reinaldo Simoes | Portfolio",
    // You should create and upload an image (1200x630px) to use for social sharing previews
    images: [
      {
        url: "https://www.reinaldo.pt/og-image-photo-critic.png", // Replace with a URL to your OG image
        width: 1200,
        height: 630,
        alt: "A preview of the AI Photo Critique application interface.",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // --- Twitter-specific metadata ---
  twitter: {
    card: "summary_large_image",
    title: "AI Photo Critique & Advisor by Reinaldo Simoes",
    description:
      "An open-source AI tool that provides expert photography critiques using GPT-4o, LangChain, and a RAG system.",
    creator: "@your_twitter_handle", // Replace with your Twitter handle if you have one
    images: ["https://www.reinaldo.pt/twitter-image-photo-critic.png"], // Replace with a URL to your Twitter preview image
  },

  // --- Other useful metadata ---
  // Helps search engines find your sitemap and defines the canonical URL
  alternates: {
    canonical: "https://photo-critic.reinaldo.pt", // Replace with your final deployed URL
  },
  // Tells crawlers where to find your robots.txt file
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
