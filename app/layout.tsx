import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Router Console — panel AI router kamu",
  description:
    "Chat, cek model, bikin foto & video dari AI router kamu. Semua terkunci di belakang login, API key aman di server.",
};

export const viewport: Viewport = {
  themeColor: "#262220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
