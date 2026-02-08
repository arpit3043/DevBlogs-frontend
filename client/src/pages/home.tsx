import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar, Footer } from "@/components/layout";
import heroImage from "@/assets/hero-tech.png";
import { Check, Sparkles, Terminal, Cpu, Share2, LineChart, Search, Bookmark, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API } from "@/lib/api";

type ArticleItem = {
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  tags: string[];
  reading_time_minutes?: number;
  view_count: number;
  published_at: string | null;
  cover_image_url?: string | null;
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [feedArticles, setFeedArticles] = useState<ArticleItem[]>([]);
  const [upNext, setUpNext] = useState<ArticleItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    apiRequest("GET", `${API.articles.list}?limit=10&offset=0`)
      .then((r) => r.json())
      .then((d: { items: ArticleItem[] }) => {
        setFeedArticles(d.items || []);
        setUpNext((d.items || []).slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setFeedLoading(false));
  }, []);

  const handleSubscribe = async (plan: string) => {
    if (!isAuthenticated) return;
    setSubscribing(plan);
    try {
      await apiRequest("POST", API.billing.subscribe, { plan });
      toast({ title: "Subscribed", description: `You're now on the ${plan} plan.` });
    } catch (error) {
      toast({ title: "Subscription failed", variant: "destructive" });
    } finally {
      setSubscribing(null);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (diff === 0) return "Today";
    if (diff === 1) return "1d";
    if (diff < 7) return `${diff}d`;
    if (diff < 30) return `${Math.floor(diff / 7)}w`;
    return `${Math.floor(diff / 30)}mo`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Top banner - Substack style */}
      <section className="bg-primary text-primary-foreground py-6 px-4">
        <div className="container mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-lg font-medium">The app for independent voices.</p>
          <div className="flex gap-2">
            <Link href="/register">
              <Button size="sm" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                Get started
              </Button>
            </Link>
            <Link href="/blog">
              <Button size="sm" variant="outline" className="border-white/50 text-white hover:bg-white/10">
                Learn more
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Two-column: Feed + Sidebar */}
      <main className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-8 max-w-6xl">
        {/* Left: Feed */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-4">
            <span className="font-medium">For you</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
          {feedLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-32 mt-2 bg-muted rounded animate-pulse" />
                </Card>
              ))}
            </div>
          ) : feedArticles.length > 0 ? (
            <div className="space-y-6">
              {feedArticles.map((a) => (
                <Link key={a.id} href={`/blog/${a.slug}`}>
                  <Card className="p-4 hover:border-primary/40 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-lg line-clamp-2">{a.title}</h2>
                        {a.subtitle && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.subtitle}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{formatTime(a.published_at)}</span>
                          {a.reading_time_minutes != null && (
                            <>
                              <span>·</span>
                              <span>{a.reading_time_minutes} min read</span>
                            </>
                          )}
                        </div>
                      </div>
                      {a.cover_image_url && (
                        <img
                          src={a.cover_image_url}
                          alt=""
                          className="w-24 h-24 object-cover rounded-lg shrink-0"
                        />
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No posts yet. Be the first to write.</p>
          )}
        </div>

        {/* Right: Sidebar */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search DevLog"
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-input bg-background text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const q = (e.target as HTMLInputElement).value.trim();
                  setLocation(q ? `/blog?q=${encodeURIComponent(q)}` : "/blog");
                }
              }}
            />
          </div>
          {!isAuthenticated && (
            <Card className="p-4 border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">Log in or sign up</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Join the most interesting and insightful discussions.
              </p>
              <div className="flex gap-2">
                <Link href="/register">
                  <Button size="sm" className="flex-1">Get started</Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" variant="outline">Sign in</Button>
                </Link>
              </div>
            </Card>
          )}
          <div>
            <h3 className="font-semibold mb-3">Up next</h3>
            {upNext.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recommendations yet.</p>
            ) : (
              <ul className="space-y-3">
                {upNext.map((a) => (
                  <li key={a.id}>
                    <Link href={`/blog/${a.slug}`} className="flex gap-3 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2 group-hover:text-primary">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {a.reading_time_minutes != null ? `${a.reading_time_minutes} min read` : ""}
                        </p>
                      </div>
                      {a.cover_image_url ? (
                        <img src={a.cover_image_url} alt="" className="w-14 h-14 object-cover rounded shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded bg-muted shrink-0 flex items-center justify-center">
                          <Bookmark className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>

      {/* Hero Section - compact */}
      <section className="relative pt-12 pb-20 overflow-hidden border-t border-border/50">
        <div className="absolute inset-0 tech-grid-bg opacity-30 pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-8">
              <Badge variant="outline" className="px-4 py-1 border-primary/40 text-primary bg-primary/10 rounded-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                v2.0 Public Beta is Live
              </Badge>
              <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">Engineers</span> <br/>
                Share Knowledge.
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                The AI-powered publishing platform built for code. 
                Write in Markdown, monetize your expertise, and reach a global technical audience.
              </p>
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                <Link href="/editor">
                  <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/25">
                    Start Writing
                  </Button>
                </Link>
                <Link href="/blog">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    Read Articles
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="flex-1 relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
              <div className="glass-panel p-2 rounded-2xl relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-500 rounded-2xl blur opacity-30" />
                <img 
                  src={heroImage} 
                  alt="DevLog Dashboard Visualization" 
                  className="rounded-xl w-full border border-white/10 shadow-2xl relative z-10"
                />
                
                {/* Floating Elements */}
                <div className="absolute -bottom-6 -left-6 bg-card border border-border p-4 rounded-lg shadow-xl z-20 flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold">AI Assistant</div>
                    <div className="text-sm font-medium">Code Refactored</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-secondary/20 border-y border-border/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Built for the Modern Stack</h2>
            <p className="text-muted-foreground">
              We stripped away the clutter and focused on what developers actually need to write and share technical content.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Terminal className="h-6 w-6 text-primary" />,
                title: "Markdown Native",
                desc: "Write exactly how you code. Full GFM support with syntax highlighting for 100+ languages."
              },
              {
                icon: <Sparkles className="h-6 w-6 text-primary" />,
                title: "AI Technical Editor",
                desc: "Our AI understands code. It helps simplify complex technical concepts and generate diagrams."
              },
              {
                icon: <Cpu className="h-6 w-6 text-primary" />,
                title: "System Design Ready",
                desc: "Built-in support for mermaid.js charts and architecture diagrams. No screenshots needed."
              },
              {
                icon: <Share2 className="h-6 w-6 text-primary" />,
                title: "Cross-Posting",
                desc: "Publish once, distribute everywhere. Sync your content to Dev.to and Medium automatically."
              },
              {
                icon: <LineChart className="h-6 w-6 text-primary" />,
                title: "Deep Analytics",
                desc: "Track read time, scroll depth, and code copy events. Know exactly what resonates."
              },
              {
                icon: <Check className="h-6 w-6 text-primary" />,
                title: "Monetization",
                desc: "Turn your technical knowledge into income with built-in subscription tiers for your readers."
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-card/50 border-border/50 hover:bg-card hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">
              Start for free, upgrade when you're ready to build a serious audience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <Card className="border-border/50 bg-card/30">
              <CardHeader>
                <CardTitle className="text-xl">Hobbyist</CardTitle>
                <div className="text-4xl font-bold mt-2">$0<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <CardDescription>For casual writing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Unlimited drafts</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Basic markdown</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Community support</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/register">
                  <Button variant="outline" className="w-full">Get Started</Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Pro Tier */}
            <Card className="border-primary bg-card relative shadow-2xl shadow-primary/10">
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                <Badge className="bg-primary text-primary-foreground">Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Pro Developer</CardTitle>
                <div className="text-4xl font-bold mt-2">$12<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <CardDescription>For building a brand</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Everything in Free</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Custom domain</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> AI Editor (50/mo)</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Advanced Analytics</li>
                </ul>
              </CardContent>
              <CardFooter>
                {isAuthenticated ? (
                  <Button className="w-full" disabled={subscribing !== null} onClick={() => handleSubscribe("pro")}>
                    {subscribing === "pro" ? "Subscribing…" : "Start Pro Trial"}
                  </Button>
                ) : (
                  <Link href="/login">
                    <Button className="w-full">Start Pro Trial</Button>
                  </Link>
                )}
              </CardFooter>
            </Card>

            {/* Team Tier */}
            <Card className="border-border/50 bg-card/30">
              <CardHeader>
                <CardTitle className="text-xl">Team</CardTitle>
                <div className="text-4xl font-bold mt-2">$49<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <CardDescription>For engineering blogs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 5 Team members</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Collaborative editing</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> API Access</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Priority Support</li>
                </ul>
              </CardContent>
              <CardFooter>
                {isAuthenticated ? (
                  <Button variant="outline" className="w-full" disabled={subscribing !== null} onClick={() => handleSubscribe("creator")}>
                    {subscribing === "creator" ? "Subscribing…" : "Upgrade to Team"}
                  </Button>
                ) : (
                  <Link href="/register">
                    <Button variant="outline" className="w-full">Contact Sales</Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
