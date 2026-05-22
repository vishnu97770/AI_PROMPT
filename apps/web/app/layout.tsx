import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import QueryProvider from "@/components/layout/QueryProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: {
    default: "PromptCraft — AI Prompt Engineering Platform",
    template: "%s | PromptCraft",
  },
  description:
    "Transform simple ideas into professional AI prompts for Midjourney, DALL-E, Stable Diffusion, video tools, coding, and more.",
  keywords: ["AI prompts", "prompt engineering", "Midjourney prompts", "AI image generation"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "PromptCraft",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <QueryProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
