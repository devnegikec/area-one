"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageSquare, Check, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  { id: "connect-gmail", title: "Connect Gmail", description: "Sync your inbox so AI can start learning", icon: Mail },
  { id: "connect-slack", title: "Connect Slack (optional)", description: "Include Slack conversations for full context", icon: MessageSquare },
  { id: "done", title: "You're all set!", description: "AI is analyzing your communications", icon: Sparkles },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [connecting, setConnecting] = React.useState(false);

  const handleConnectGmail = () => {
    setConnecting(true);
    window.location.href = "/api/integrations/gmail/connect";
  };

  const handleConnectSlack = () => {
    setConnecting(true);
    window.location.href = "/api/integrations/slack/connect";
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      router.push("/dashboard");
    }
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-none">
                <div
                  className={`h-2 rounded-full flex-1 ${
                    i < currentStep ? "bg-violet-500" : i === currentStep ? "bg-violet-300" : "bg-muted"
                  }`}
                />
                {i < steps.length - 1 && <div className="w-0" />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/20 mb-4">
              <step.icon className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-xl font-bold">{step.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {step.id === "connect-gmail" && (
              <Button className="w-full gap-2" onClick={handleConnectGmail} disabled={connecting}>
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Connect Gmail
              </Button>
            )}
            {step.id === "connect-slack" && (
              <Button className="w-full gap-2" variant="outline" onClick={handleConnectSlack} disabled={connecting}>
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Connect Slack
              </Button>
            )}
            {step.id === "done" && (
              <Button className="w-full gap-2" onClick={handleNext}>
                <Check className="h-4 w-4" /> Go to Dashboard
              </Button>
            )}

            {(step.id === "connect-gmail" || step.id === "connect-slack") && (
              <Button variant="ghost" className="w-full gap-2" onClick={handleNext}>
                Skip for now <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
