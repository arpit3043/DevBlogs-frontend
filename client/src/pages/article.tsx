import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Share2, Bookmark, Sparkles } from "lucide-react";
import { API_BASE_URL } from "@/lib/queryClient";
import { API } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { logger } from "@/lib/logger";

type ArticleData = {
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  content: string;
  cover_image_url?: string;
  author_id: number;
  tags: string[];
  reading_time_minutes?: number;
  view_count: number;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { toast } = useToast();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [tldr, setTldr] = useState<string | null>(null);
  const [loadingTldr, setLoadingTldr] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const url = `${API_BASE_URL}${API.articles.get(slug)}`;
    logger.info("Fetching article", { slug, url });
    fetch(url, { headers, credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Article not found" : `${res.status}`);
        return res.json();
      })
      .then(setArticle)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const fetchTldr = async () => {
    if (!slug || !article) return;
    setLoadingTldr(true);
    try {
      const res = await apiRequest("POST", API.ai.tldr, { article_slug: slug });
      const data = await res.json();
      setTldr(data.tldr || "");
    } catch {
      toast({
        title: "TL;DR unavailable",
        description: "Sign in with a Pro/Creator account to use AI TL;DR.",
        variant: "destructive",
      });
    } finally {
      setLoadingTldr(false);
    }
  };

  if (!slug) return null;
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <p className="text-destructive">{error}</p>
          <Link href="/blog">
            <Button variant="outline" className="mt-4">Back to articles</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading || !article) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <Skeleton className="h-12 w-3/4 mb-6" />
          <Skeleton className="h-6 w-1/2 mb-12" />
          <Skeleton className="h-64 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  const publishedDate = article.published_at ? new Date(article.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          {article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.slice(0, 5).map((t) => (
                <Badge key={t} variant="outline" className="text-primary border-primary/30">
                  {t}
                </Badge>
              ))}
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight mb-6">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="text-xl text-muted-foreground mb-6">{article.subtitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {publishedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {publishedDate}
              </span>
            )}
            {article.reading_time_minutes != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {article.reading_time_minutes} min read
              </span>
            )}
            <span>{article.view_count} views</span>
          </div>
        </div>

        {article.cover_image_url && (
          <div className="rounded-xl overflow-hidden mb-12 border border-border/50 shadow-2xl">
            <img
              src={article.cover_image_url}
              alt=""
              className="aspect-[21/9] w-full object-cover"
            />
          </div>
        )}

        {article.status === "published" && (
          <div className="bg-secondary/20 border border-primary/20 rounded-lg p-6 mb-12 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-primary font-medium">
                <Sparkles className="h-4 w-4" />
                AI TL;DR
              </span>
              {!tldr && (
                <Button variant="outline" size="sm" onClick={fetchTldr} disabled={loadingTldr}>
                  {loadingTldr ? "Generating…" : "Generate TL;DR"}
                </Button>
              )}
            </div>
            {tldr ? (
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{tldr}</p>
            ) : loadingTldr ? (
              <p className="text-muted-foreground text-sm">Generating summary…</p>
            ) : null}
          </div>
        )}

        <article className="prose prose-invert prose-lg max-w-none">
          <div className="whitespace-pre-wrap font-mono text-base leading-relaxed">
            {article.content}
          </div>
        </article>

        <Separator className="my-12" />

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" title="Bookmark">
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Share">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
