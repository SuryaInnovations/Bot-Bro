import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased select-text">
        {children}
      </body>
    </html>
  );
}
