import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BOT BRO — Intelligent AI Assistant",
  description:
    "Production-grade personal AI assistant with reasoning, artifacts, coding, web search, and projects.",
  icons: {
    icon: "/bot-bro-logo.jpg",
    apple: "/bot-bro-logo.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#141416" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen min-h-[100dvh] h-[100dvh] bg-[var(--background)] text-[var(--foreground)] antialiased select-text overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
