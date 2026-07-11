import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/nav";
import { ThemeScript } from "@/components/theme-script";

export const metadata: Metadata = {
  title: "Orchestra · Human-AgentOS",
  description: "Control plane cho lực lượng lao động lai người + AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>
          <Nav />
          <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
