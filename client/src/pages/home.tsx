import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar, Footer } from "@/components/layout";
import heroImage from "@/assets/hero-tech.png";
import { Check, Sparkles, Terminal, Cpu, Share2, LineChart } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
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
                <Button variant="outline" className="w-full">Get Started</Button>
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
                <Button className="w-full">Start Pro Trial</Button>
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
                <Button variant="outline" className="w-full">Contact Sales</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
