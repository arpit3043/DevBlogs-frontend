import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { API } from "@/lib/api";
import { logger } from "@/lib/logger";

type ArticleItem = {
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  tags: string[];
  reading_time_minutes?: number;
  view_count: number;
  published_at: string | null;
  created_at: string;
};

type ListResponse = {
  items: ArticleItem[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
};

export default function BlogList() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `${API.articles.list}?limit=20&offset=0`;
    logger.info("Fetching article list", { url });
    apiRequest("GET", url)
      .then((res) => res.json())
      .then(setData)
      .catch((e) => setError(e?.message ?? "Failed to load articles"))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <p className="text-destructive">{error}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-display font-bold mb-8">Articles</h1>
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : data?.items?.length ? (
          <div className="space-y-6">
            {data.items.map((a) => (
              <Link key={a.id} href={`/blog/${a.slug}`}>
                <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {a.tags?.slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-xl">{a.title}</CardTitle>
                    {a.subtitle && <CardDescription>{a.subtitle}</CardDescription>}
                  </CardHeader>
                  <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {a.published_at ? new Date(a.published_at).toLocaleDateString() : "Draft"}
                    </span>
                    {a.reading_time_minutes != null && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {a.reading_time_minutes} min read
                      </span>
                    )}
                    <span>{a.view_count} views</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No articles yet.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
