"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  Zap,
  BookMarked,
  BarChart3,
  Clock,
  ChevronRight,
} from "lucide-react";
import { cn, copyToClipboard, formatRelativeDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import { toastCopied, toastError } from "@/components/ui/toast";
import { CATEGORY_CONFIG, CATEGORY_MAP } from "@/lib/constants";

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserStats {
  username: string;
  plan: "FREE" | "PRO" | "CREATOR" | "ENTERPRISE";
  totalPrompts: number;
  promptsToday: number;
  dailyLimit: number | null;
  creditsRemaining: number;
  collectionsCount: number;
}

interface RecentPrompt {
  id: string;
  userInput: string;
  generatedPrompt: string;
  createdAt: string;
  copyCount: number;
  category: { slug: string; name: string };
}

interface TrendingPrompt {
  id: string;
  generatedPrompt: string;
  copyCount: number;
  category: { slug: string; name: string };
}

// ── Fetch helpers ──────────────────────────────────────────────────────────────

const fetchStats = (): Promise<UserStats> =>
  fetch("/api/user/stats").then((r) => {
    if (!r.ok) throw new Error("Failed to fetch stats");
    return r.json();
  });

const fetchRecent = (): Promise<RecentPrompt[]> =>
  fetch("/api/prompts/recent").then((r) => {
    if (!r.ok) throw new Error("Failed to fetch recent prompts");
    return r.json();
  });

const fetchTrending = (): Promise<TrendingPrompt[]> =>
  fetch("/api/prompts/trending").then((r) => {
    if (!r.ok) throw new Error("Failed to fetch trending");
    return r.json();
  });

// ── Greeting ───────────────────────────────────────────────────────────────────

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

// ── Welcome Section ────────────────────────────────────────────────────────────

function WelcomeSection({
  stats,
  loading,
}: {
  stats?: UserStats;
  loading: boolean;
}) {
  const [greeting, setGreeting] = useState("");
  const [dateStr, setDateStr] = useState("");

  // Resolved client-side to avoid SSR hydration mismatch
  useEffect(() => {
    const now = new Date();
    setGreeting(getGreeting(now.getHours()));
    setDateStr(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    );
  }, []);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting || "Welcome"},{" "}
          {loading ? (
            <Skeleton className="inline-block h-7 w-28 align-middle" />
          ) : (
            <span className="text-primary">{stats?.username ?? "there"}</span>
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {dateStr || <Skeleton className="h-4 w-44" />}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {loading ? (
          <Skeleton className="h-6 w-16 rounded-full" />
        ) : (
          <>
            <Badge variant={(stats?.plan as "FREE") ?? "FREE"}>
              {stats?.plan ?? "FREE"}
            </Badge>
            {(!stats?.plan || stats.plan === "FREE") && (
              <Button size="sm" variant="outline-primary" asChild>
                <Link href="/settings/billing">
                  Upgrade <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Stats Row ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  sub?: string;
  progress?: number;
  loading?: boolean;
}

function StatCard({ title, value, icon, sub, progress, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="h-3.5 w-24 mb-3" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-20 mb-2" />
          {progress !== undefined && <Skeleton className="h-1.5 w-full rounded-full" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card hoverable>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums leading-none">{value}</p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            )}
            {progress !== undefined && (
              <Progress value={progress} className="mt-2 h-1.5" />
            )}
          </div>
          <div className="shrink-0 p-2 rounded-lg bg-muted text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsRow({
  stats,
  loading,
}: {
  stats?: UserStats;
  loading: boolean;
}) {
  const limit = stats?.dailyLimit ?? 10;
  const todayPct =
    stats && limit > 0
      ? Math.min(100, Math.round((stats.promptsToday / limit) * 100))
      : 0;

  const limitLabel = stats?.dailyLimit === null ? "∞" : String(stats?.dailyLimit ?? 10);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Prompts"
        value={(stats?.totalPrompts ?? 0).toLocaleString()}
        icon={<Sparkles className="h-4 w-4" />}
        sub="lifetime"
        loading={loading}
      />
      <StatCard
        title="Prompts Today"
        value={`${stats?.promptsToday ?? 0} / ${limitLabel}`}
        icon={<Zap className="h-4 w-4" />}
        sub={`${Math.max(0, (stats?.dailyLimit ?? 10) - (stats?.promptsToday ?? 0))} remaining`}
        progress={todayPct}
        loading={loading}
      />
      <StatCard
        title="Credits"
        value={(stats?.creditsRemaining ?? 0).toLocaleString()}
        icon={<BarChart3 className="h-4 w-4" />}
        sub="remaining"
        loading={loading}
      />
      <StatCard
        title="Collections"
        value={stats?.collectionsCount ?? 0}
        icon={<BookMarked className="h-4 w-4" />}
        sub="saved"
        loading={loading}
      />
    </div>
  );
}

// ── Quick Generate ─────────────────────────────────────────────────────────────

function QuickGenerateCard() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [category, setCategory] = useState(CATEGORY_CONFIG[0]?.slug ?? "ai-image-generation");

  const handleGenerate = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const params = new URLSearchParams({ input: trimmed, category });
    router.push(`/generate?${params.toString()}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Quick Generate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="What do you want to create? e.g. A cyberpunk city at dusk…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="resize-none min-h-[72px]"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
        />
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_CONFIG.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    <span className="mr-1">{c.icon}</span>
                    {c.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!input.trim()}
            className="shrink-0"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Generate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Recent Prompts ─────────────────────────────────────────────────────────────

function PromptCard({ prompt }: { prompt: RecentPrompt }) {
  const [copied, setCopied] = useState(false);
  const catConfig = CATEGORY_MAP[prompt.category.slug];

  const handleCopy = async () => {
    const ok = await copyToClipboard(prompt.generatedPrompt);
    if (ok) {
      setCopied(true);
      toastCopied();
      setTimeout(() => setCopied(false), 2000);
    } else {
      toastError("Failed to copy to clipboard");
    }
  };

  return (
    <Card hoverable className="flex flex-col">
      <CardContent className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0",
              catConfig?.colorClass ?? "bg-muted text-muted-foreground"
            )}
          >
            <span>{catConfig?.icon}</span>
            {catConfig?.shortName ?? prompt.category.name}
          </span>
          <button
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground transition-colors rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Copy prompt"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
          {prompt.userInput}
        </p>

        <p className="text-sm line-clamp-3 leading-relaxed flex-1">
          {prompt.generatedPrompt}
        </p>

        <p className="text-[10px] text-muted-foreground pt-1">
          {formatRelativeDate(new Date(prompt.createdAt))}
        </p>
      </CardContent>
    </Card>
  );
}

function PromptCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-4 w-4 rounded" />
        </div>
        <Skeleton className="h-3 w-3/4" />
        <SkeletonText lines={3} />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );
}

function RecentPromptsSection({
  prompts,
  loading,
}: {
  prompts?: RecentPrompt[];
  loading: boolean;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Recent Prompts
        </h2>
        <Link
          href="/history"
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PromptCardSkeleton key={i} />
          ))}
        </div>
      ) : !prompts?.length ? (
        <EmptyState
          icon={Sparkles}
          title="No prompts yet"
          description="Generate your first AI prompt and it will appear here."
          action={{ label: "Start generating", href: "/generate" }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prompts.map((p) => (
            <PromptCard key={p.id} prompt={p} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Trending Today ─────────────────────────────────────────────────────────────

function TrendingSection({
  trending,
  loading,
}: {
  trending?: TrendingPrompt[];
  loading: boolean;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (prompt: TrendingPrompt) => {
    const ok = await copyToClipboard(prompt.generatedPrompt);
    if (ok) {
      setCopiedId(prompt.id);
      toastCopied();
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Trending Today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-start">
              <Skeleton className="h-4 w-3 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          ))
        ) : !trending?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nothing trending yet — be the first!
          </p>
        ) : (
          trending.map((p, i) => {
            const catConfig = CATEGORY_MAP[p.category.slug];
            return (
              <div key={p.id} className="flex items-start gap-2.5 group">
                <span className="text-xs font-bold text-muted-foreground w-3.5 shrink-0 mt-0.5 tabular-nums">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-[10px] font-semibold mb-0.5",
                      catConfig?.colorClass?.split(" ")[1] ?? "text-muted-foreground"
                    )}
                  >
                    {catConfig?.icon} {catConfig?.shortName ?? p.category.name}
                  </p>
                  <p className="text-xs line-clamp-2 text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                    {p.generatedPrompt}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {p.copyCount.toLocaleString()} copies
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(p)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 mt-0.5 focus-visible:opacity-100 rounded p-0.5"
                  aria-label="Copy prompt"
                >
                  {copiedId === p.id ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ── Category Shortcuts ─────────────────────────────────────────────────────────

function CategoryShortcuts() {
  const router = useRouter();
  const shortcuts = CATEGORY_CONFIG.slice(0, 6);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Access</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {shortcuts.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => router.push(`/generate?category=${cat.slug}`)}
              className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center transition-colors hover:bg-accent border border-transparent hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="text-xl leading-none">{cat.icon}</span>
              <span className="text-[10px] font-medium leading-tight text-muted-foreground">
                {cat.shortName}
              </span>
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 text-xs text-muted-foreground"
          asChild
        >
          <Link href="/generate">
            All categories
            <ArrowRight className="ml-1.5 h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["user-stats"],
    queryFn: fetchStats,
    staleTime: 30_000,
  });

  const { data: recentPrompts, isLoading: recentLoading } = useQuery({
    queryKey: ["recent-prompts"],
    queryFn: fetchRecent,
    staleTime: 30_000,
  });

  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending-prompts"],
    queryFn: fetchTrending,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <WelcomeSection stats={stats} loading={statsLoading} />

      {/* Stats row */}
      <StatsRow stats={stats} loading={statsLoading} />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Generate + Recent Prompts */}
        <div className="lg:col-span-2 space-y-6">
          <QuickGenerateCard />
          <RecentPromptsSection prompts={recentPrompts} loading={recentLoading} />
        </div>

        {/* Right: Trending + Category Shortcuts */}
        <div className="space-y-6">
          <TrendingSection trending={trending} loading={trendingLoading} />
          <CategoryShortcuts />
        </div>
      </div>
    </div>
  );
}
