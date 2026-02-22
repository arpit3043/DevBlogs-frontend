import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Footer, Navbar } from "@/components/layout";
import { Check, Loader2, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API } from "@/lib/api";

declare global {
    interface Window {
        Razorpay?: {
            new (options: {
                key: string;
                amount: number;
                currency: string;
                order_id: string;
                name: string;
                description?: string;
                handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
                prefill?: { email?: string; name?: string };
                theme?: { color: string };
                modal?: { ondismiss: () => void };
            }): { open: () => void };
        };
    }
}

type PlanInfo = {
    plan_key: string;
    name: string;
    amount_inr: number;
    interval: string;
    subscription_plan: string;
};

type CreateOrderResponse = {
    order_id: string;
    amount_paise: number;
    currency: string;
    key_id: string;
    plan_key: string;
    internal_order_id: number;
};

export default function Payment() {
    const [, setLocation] = useLocation();
    const { isAuthenticated } = useAuth();
    const { toast } = useToast();
    const [plans, setPlans] = useState<PlanInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [payingPlanKey, setPayingPlanKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            setLocation("/login");
            return;
        }
        let cancelled = false;
        async function fetchPlans() {
            try {
                setError(null);
                const res = await apiRequest("GET", API.billing.plans);
                const data = await res.json();
                if (!cancelled && Array.isArray(data)) setPlans(data);
            } catch (e) {
                if (!cancelled) {
                    const msg = e instanceof Error ? e.message : "Failed to load plans";
                    setError(msg);
                    toast({ title: "Error", description: msg, variant: "destructive" });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchPlans();
        return () => { cancelled = true; };
    }, [isAuthenticated, setLocation, toast]);

    const openRazorpay = async (plan: PlanInfo) => {
        if (!window.Razorpay) {
            toast({ title: "Payment unavailable", description: "Razorpay script failed to load.", variant: "destructive" });
            return;
        }
        setPayingPlanKey(plan.plan_key);
        setError(null);
        try {
            const createRes = await apiRequest("POST", API.billing.createOrder, { plan_key: plan.plan_key });
            const orderData: CreateOrderResponse = await createRes.json();
            const { order_id, amount_paise, currency, key_id } = orderData;
            if (!order_id || !key_id) {
                throw new Error("Invalid order response");
            }
            const options = {
                key: key_id,
                amount: amount_paise,
                currency,
                order_id,
                name: "DevBlogs",
                description: `${plan.name} - ${plan.subscription_plan}`,
                handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
                    try {
                        const verifyRes = await apiRequest("POST", API.billing.verifyPayment, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            toast({ title: "Payment successful", description: "Your subscription is now active." });
                            setLocation("/#pricing");
                        } else {
                            toast({ title: "Verification failed", description: verifyData.message || "Please contact support.", variant: "destructive" });
                        }
                    } catch (e) {
                        const msg = e instanceof Error ? e.message : "Verification failed";
                        toast({ title: "Error", description: msg, variant: "destructive" });
                    } finally {
                        setPayingPlanKey(null);
                    }
                },
                theme: { color: "#6366f1" },
                modal: {
                    ondismiss: () => {
                        setPayingPlanKey(null);
                    },
                },
            };
            const rzp = window.Razorpay.new(options);
            rzp.open();
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to start payment";
            setError(msg);
            toast({ title: "Payment failed", description: msg, variant: "destructive" });
            setPayingPlanKey(null);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-display font-bold">Upgrade your plan</h1>
                    <p className="text-muted-foreground mt-2">Choose a plan and pay securely with Razorpay.</p>
                </div>
                {error && (
                    <div className="mb-4 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                        {error}
                    </div>
                )}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : plans.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground">No plans available. Payment gateway may not be configured.</p>
                            <Link href="/">
                                <Button variant="outline" className="mt-4">Back to home</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {plans.map((plan) => (
                            <Card key={plan.plan_key} className="border-border/50">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                                        {plan.subscription_plan === "pro" && (
                                            <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                                        )}
                                    </div>
                                    <div className="text-3xl font-bold mt-2">
                                        ₹{plan.amount_inr}
                                        <span className="text-base font-normal text-muted-foreground">/{plan.interval === "year" ? "year" : "mo"}</span>
                                    </div>
                                    <CardDescription>{plan.subscription_plan === "pro" ? "Pro Developer" : "Creator / Team"}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <ul className="space-y-1">
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Secure payment</li>
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Instant activation</li>
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full"
                                        disabled={payingPlanKey !== null}
                                        onClick={() => openRazorpay(plan)}
                                    >
                                        {payingPlanKey === plan.plan_key ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <CreditCard className="h-4 w-4 mr-2" />
                                        )}
                                        {payingPlanKey === plan.plan_key ? "Opening…" : "Pay with Razorpay"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
                <div className="mt-8 text-center">
                    <Link href="/">
                        <Button variant="ghost">Back to home</Button>
                    </Link>
                </div>
            </main>
            <Footer />
        </div>
    );
}
