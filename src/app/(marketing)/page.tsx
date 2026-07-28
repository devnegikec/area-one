"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Brain, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "AI Memory",
    description: "Your AI remembers every customer conversation, objection, budget, and timeline — across email, Slack, and meetings.",
  },
  {
    icon: Mail,
    title: "Smart Drafting",
    description: "Generate personalized emails, proposals, and follow-ups that match your tone and your customer's context.",
  },
  {
    icon: BarChart3,
    title: "Revenue Intelligence",
    description: "See which deals need attention, which are at risk, and what to do next — all prioritized by AI.",
  },
  {
    icon: Shield,
    title: "Your Data, Your Database",
    description: "Unlike every other AI tool, your data lives in YOUR Supabase account. We don't hold your emails — you do.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-bold">
              A1
            </div>
            Area-One
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1">
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
              <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
              AI Revenue Execution Agent
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Never lose a deal to a
              <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent"> forgotten follow-up</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Area-One connects your Gmail, Slack, and calendar. Our AI builds customer memory, recommends next actions, and drafts responses — so you close more deals.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Built for founders who sell</h2>
            <p className="text-muted-foreground mt-4">
              Current CRMs are systems of record. Area-One is a system of execution.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 bg-background shadow-sm">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Ready to stop losing deals?</h2>
            <p className="text-muted-foreground">
              Connect your Gmail in 60 seconds. Your AI revenue assistant starts working immediately.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Area-One. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
