import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chaosline | Pre-deployment safety testing for AI agents",
  description:
    "Break your agent's tools on purpose. Chaosline deterministically tests whether AI agents cause harm when their tools fail. 16 fault kinds, 38 preset scenarios, zero code changes.",
  keywords: [
    "AI agent testing",
    "fault injection",
    "LLM safety",
    "MCP proxy",
    "agent resilience",
    "chaosline",
  ],
  openGraph: {
    title: "Chaosline | Pre-deployment safety testing for AI agents",
    description:
      "Break your agent's tools on purpose. Find safety bugs before deployment.",
    type: "website",
    url: "https://chaosline.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chaosline",
    description: "Pre-deployment fault injection testing for AI agents.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
