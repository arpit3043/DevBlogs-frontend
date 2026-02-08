import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    if (user?.role !== "admin") {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, user?.role, setLocation]);

  if (user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-bold mb-4">Admin</h1>
        <p className="text-muted-foreground mb-6">
          Manage users, content, and activity logs.
        </p>
        <div className="rounded-lg border border-border p-6 text-center text-muted-foreground">
          Admin panel coming soon. You can view users, blogs, comments, and activity logs here.
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </main>
    </div>
  );
}
