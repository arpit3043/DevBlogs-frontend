import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Code, 
  List, 
  ListOrdered,
  Sparkles,
  Save,
  ArrowLeft
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API } from "@/lib/api";
import { logger } from "@/lib/logger";

export default function Editor() {
  const { toast } = useToast();
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(`# Introduction\n\nWrite your technical deep dive here...`);
  const [slug, setSlug] = useState("");

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    logger.info("Save draft clicked", { titleLength: title.length });
    try {
      const res = await apiRequest("POST", API.articles.create, {
        title: title.trim(),
        content: content || "",
      });
      const data = await res.json();
      if (data.slug) setSlug(data.slug);
      toast({
        title: "Draft saved",
        description: "Your draft has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiAssist = async () => {
    if (!content?.trim()) {
      toast({
        title: "Content required",
        description: "Add some content before using AI assist.",
        variant: "destructive",
      });
      return;
    }
    setIsAiGenerating(true);
    try {
      const response = await apiRequest("POST", API.ai.improve, {
        content,
        instruction: "Add a concise TL;DR (2-3 sentences) at the beginning. Keep the rest unchanged.",
      });
      const data = await response.json();
      const improved = data.improved_content || data.content;
      if (improved) setContent(improved);
      toast({
        title: "AI Assist applied",
        description: "Content updated with TL;DR.",
      });
    } catch (error) {
      toast({
        title: "AI Assist failed",
        description: "Failed to improve content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Editor Header */}
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Drafts</span>
            <span>/</span>
            <span className="text-foreground font-medium">Untitled Article</span>
          </div>
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Unsaved</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSaveDraft} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
            Publish
          </Button>
        </div>
      </header>

      {/* Main Editor Area */}
      <main className="flex-1 container mx-auto max-w-4xl py-12 px-4 flex flex-col gap-6">
        
        {/* Title Input */}
        <Input 
          placeholder="Article Title" 
          className="text-4xl font-display font-bold border-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50 h-auto bg-transparent"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 bg-secondary/30 rounded-lg border border-border sticky top-20 z-10 backdrop-blur-sm">
          <Button variant="ghost" size="icon" className="h-8 w-8"><Bold className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Italic className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><LinkIcon className="h-4 w-4" /></Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8"><Code className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><ImageIcon className="h-4 w-4" /></Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8"><List className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><ListOrdered className="h-4 w-4" /></Button>
          
          <div className="flex-1" />
          
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs gap-2 border-primary/30 text-primary hover:bg-primary/10"
            onClick={handleAiAssist}
            disabled={isAiGenerating}
          >
            <Sparkles className={`h-3 w-3 ${isAiGenerating ? 'animate-spin' : ''}`} />
            {isAiGenerating ? 'Generating...' : 'AI Assist'}
          </Button>
        </div>

        {/* Content Area */}
        <Textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 min-h-[500px] font-mono text-base resize-none border-none focus-visible:ring-0 p-0 bg-transparent leading-relaxed"
          placeholder="Start writing..."
        />
      </main>
    </div>
  );
}
