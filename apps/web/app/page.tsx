import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm border rounded-full border-primary/30 bg-primary/10 text-primary">
          <Sparkles className="w-3.5 h-3.5" />
          Intent Translation Engine
        </div>

        <h1 className="max-w-4xl mb-6 text-5xl font-bold tracking-tight sm:text-7xl">
          Turn ideas into{" "}
          <span className="text-primary">professional prompts</span>{" "}
          instantly
        </h1>

        <p className="max-w-2xl mb-10 text-lg text-muted-foreground">
          PromptCraft bridges the gap between what you imagine and what AI
          understands — across image generation, video, coding, design, and
          more.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white rounded-lg bg-primary hover:bg-primary/90 transition-colors"
          >
            Start Generating <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/community"
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold border rounded-lg border-border hover:bg-accent transition-colors"
          >
            Explore Community
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-16">
          {["Midjourney", "DALL-E 3", "Stable Diffusion", "Runway", "Claude", "GPT-4o"].map(
            (tool) => (
              <span
                key={tool}
                className="px-3 py-1 text-sm rounded-full bg-muted text-muted-foreground"
              >
                {tool}
              </span>
            )
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-3">
          {[
            {
              icon: <Zap className="w-5 h-5 text-primary" />,
              title: "Instant Generation",
              desc: "Streaming output with first token under 400ms. No waiting.",
            },
            {
              icon: <Sparkles className="w-5 h-5 text-primary" />,
              title: "15 Domains",
              desc: "Image, video, code, UI, resume, presentations and more.",
            },
            {
              icon: <Shield className="w-5 h-5 text-primary" />,
              title: "Smart Routing",
              desc: "Right model for every request. Claude for creative, Llama for fast.",
            },
          ].map((f) => (
            <div key={f.title} className="p-6 border rounded-xl border-border bg-card">
              <div className="mb-3">{f.icon}</div>
              <h3 className="mb-2 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
