import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/nav";
import { ThemeScript } from "@/components/theme-script";

// Self-hosted at build (no runtime request, no layout shift) — the enterprise
// pattern. Serif titles + mono labels give the app the report's editorial voice.
const sans = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-sans", display: "swap" });
const serif = Newsreader({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Orchestra · Human-AgentOS",
  description: "Control plane cho lực lượng lao động lai người + AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <Nav />
          <main className="mx-auto w-full max-w-[1200px] px-6 py-12 md:px-12 md:py-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
