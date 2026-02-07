import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getTokenFromAuthResponse } from "@/lib/queryClient";
import { API } from "@/lib/api";
import { logger } from "@/lib/logger";

declare global {
  interface Window {
    google: any;
  }
}

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  /* =========================
     Google Sign-In Init (ONCE)
     ========================= */
  useEffect(() => {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleCallback,
    });
  }, []);

  /* =========================
     Google Login Callback
     ========================= */
  const handleGoogleCallback = async (response: any) => {
    try {
      if (!response?.credential) {
        throw new Error("No Google credential received");
      }

      const apiResponse = await apiRequest(
        "POST",
        "/api/auth/google-login",
        { token: response.credential }
      );

      const data = await apiResponse.json();
      const token = getTokenFromAuthResponse(data);

      if (!token) throw new Error("Token missing");

      localStorage.setItem("token", token);

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      setLocation("/dashboard");
    } catch (error) {
      logger.error("Google login failed", error);
      toast({
        title: "Google login failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  /* =========================
     Email / Phone Login
     ========================= */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const identifier = email || phone;
      if (!identifier || !password) {
        throw new Error("Missing credentials");
      }

      const response = await apiRequest(
        "POST",
        API.auth.login,
        { identifier, password }
      );

      const data = await response.json();
      const token = getTokenFromAuthResponse(data);

      if (!token) throw new Error("Token not received");

      localStorage.setItem("token", token);

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      setLocation("/dashboard");
    } catch (error) {
      logger.error("Login failed", error);
      toast({
        title: "Login failed",
        description: "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     Trigger Google Popup
     ========================= */
  const handleGoogleLogin = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>

            {/* EMAIL LOGIN */}
            <TabsContent value="email">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            {/* PHONE LOGIN */}
            <TabsContent value="phone">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* GOOGLE LOGIN */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleLogin}
            >
              Continue with Google
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
