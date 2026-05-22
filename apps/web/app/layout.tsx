import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import QueryProvider from "@/components/layout/QueryProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PromptCraft — AI Prompt Engineering Platform",
    template: "%s | PromptCraft",
  },
  description:
    "Transform simple ideas into professional AI prompts for Midjourney, DALL-E, Stable Diffusion, video tools, coding, and more.",
  keywords: [
    "AI prompts",
    "prompt engineering",
    "Midjourney prompts",
    "AI image generation",
    "ChatGPT prompts",
    "Stable Diffusion",
  ],
  authors: [{ name: "PromptCraft" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "PromptCraft",
    title: "PromptCraft — AI Prompt Engineering Platform",
    description: "Transform simple ideas into professional AI prompts.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptCraft",
    description: "Transform simple ideas into professional AI prompts.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster
            richColors
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast: "font-sans",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
