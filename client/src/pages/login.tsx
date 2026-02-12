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

function persistSession(token: string) {
  localStorage.setItem("token", token);
  apiRequest("GET", API.auth.me)
    .then((r) => r.json())
    .then((data) => {
      const user = {
        id: data.id,
        username: data.username,
        full_name: data.full_name ?? null,
        email: data.email ?? null,
        role: data.role ?? "reader",
      };
      localStorage.setItem("user", JSON.stringify(user));
    })
    .catch(() => {});
}

declare global {
  interface Window {
    google: any;
  }
}

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) setLocation("/dashboard");
  }, [token, setLocation]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  /* =========================
     OTP Login Component
     ========================= */
  function OTPLoginForm() {
    const [otpEmail, setOtpEmail] = useState("");
    const [otpPhone, setOtpPhone] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const handleSendOTP = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!otpEmail && !otpPhone) {
        toast({
          title: "Error",
          description: "Please enter email or phone number",
          variant: "destructive",
        });
        return;
      }

      setIsSending(true);
      try {
        const response = await apiRequest("POST", API.auth.otpSend, {
          email: otpEmail || undefined,
          phone: otpPhone || undefined,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to send OTP");
        }

        setOtpSent(true);
        setCountdown(60);
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        toast({
          title: "OTP sent",
          description: "Please check your phone/email for the OTP code",
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to send OTP";
        toast({
          title: "Failed to send OTP",
          description: msg,
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
      }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!otpCode) {
        toast({
          title: "Error",
          description: "Please enter OTP code",
          variant: "destructive",
        });
        return;
      }

      setIsVerifying(true);
      try {
        const response = await apiRequest("POST", API.auth.otpVerify, {
          email: otpEmail || undefined,
          phone: otpPhone || undefined,
          code: otpCode,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.detail || "Invalid OTP");
        }

        const data = await response.json();
        const token = getTokenFromAuthResponse(data);

        if (!token) throw new Error("Token missing");
        persistSession(token);
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        setLocation("/dashboard");
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "OTP verification failed";
        toast({
          title: "OTP verification failed",
          description: msg,
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    return (
      <div className="space-y-4">
        {!otpSent ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp-email">Email (optional)</Label>
              <Input
                id="otp-email"
                type="email"
                placeholder="Enter your email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                disabled={isSending || !!otpPhone}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp-phone">Phone Number (optional)</Label>
              <Input
                id="otp-phone"
                type="tel"
                placeholder="+1234567890"
                value={otpPhone}
                onChange={(e) => setOtpPhone(e.target.value)}
                disabled={isSending || !!otpEmail}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSending || (!otpEmail && !otpPhone)}>
              {isSending ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp-code">Enter OTP Code</Label>
              <Input
                id="otp-code"
                type="text"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-muted-foreground text-center">
                {otpEmail ? `Code sent to ${otpEmail}` : `Code sent to ${otpPhone}`}
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isVerifying || otpCode.length !== 6}>
              {isVerifying ? "Verifying..." : "Verify OTP"}
            </Button>
            {countdown > 0 ? (
              <p className="text-xs text-center text-muted-foreground">
                Resend OTP in {countdown}s
              </p>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs"
                onClick={() => {
                  setOtpSent(false);
                  setOtpCode("");
                  setCountdown(0);
                }}
              >
                Resend OTP
              </Button>
            )}
          </form>
        )}
      </div>
    );
  }

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
        API.auth.googleLogin,
        { token: response.credential }
      );
      
      if (!apiResponse.ok) {
        const err = await apiResponse.json().catch(() => ({}));
        throw new Error(err.detail || "Google login failed");
      }

      const data = await apiResponse.json();
      const token = getTokenFromAuthResponse(data);

      if (!token) throw new Error("Token missing");
      persistSession(token);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      setLocation("/dashboard");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Google login failed";
      logger.error("Google login failed", error);
      toast({
        title: "Google login failed",
        description: msg.includes("not configured") ? "Google OAuth is not configured on the server." : msg,
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
      persistSession(token);
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
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

            {/* OTP LOGIN */}
            <TabsContent value="otp">
              <OTPLoginForm />
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
