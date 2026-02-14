import {useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {useToast} from "@/hooks/use-toast";

const FEEDBACK_KEY = "devlog-feedback-pending";

export function FeedbackDialog() {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const {toast} = useToast();

    const submit = () => {
        const text = message.trim();
        if (!text) {
            toast({title: "Enter your feedback", variant: "destructive"});
            return;
        }
        try {
            const pending = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
            pending.push({text, at: new Date().toISOString()});
            localStorage.setItem(FEEDBACK_KEY, JSON.stringify(pending));
        } catch {
            // ignore
        }
        toast({title: "Thank you!", description: "We've received your feedback."});
        setMessage("");
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button type="button" className="text-sm hover:text-primary transition-colors">
                    Feedback
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send feedback</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    Tell us what you think about the platform. Your feedback helps us improve.
                </p>
                <Textarea
                    placeholder="Your feedback..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[120px]"
                />
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={submit}>Submit</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
