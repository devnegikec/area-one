"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Brain, Mail, Shield, Sparkles, Clock, Search, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Brain, title: "AI Memory", description: "Remembers every conversation, objection, budget, and timeline across email, Slack, and meetings." },
  { icon: Sparkles, title: "Smart Recommendations", description: "AI suggests next-best-actions: follow up, share pricing, schedule a demo — prioritized by urgency." },
  { icon: Mail, title: "Auto-Drafting", description: "Generate personalized emails, proposals, and follow-ups matching your tone and customer context." },
  { icon: Search, title: "Instant Search", description: "Cmd+K to search across all emails and memory. Ask AI questions and get answers with citations." },
  { icon: Clock, title: "Timeline View", description: "Chronological view of every customer interaction — emails, deals, commitments, objections." },
  { icon: Shield, title: "Your Data, Your DB", description: "Data lives in YOUR database. We don't hold your emails — privacy by architecture." },
];

const steps = [
  { step: "1", title: "Connect your email", description: "Link Gmail in one click. We sync your inbox securely." },
  { step: "2", title: "AI builds memory", description: "DeepSeek extracts companies, contacts, facts, and timelines automatically." },
  { step: "3", title: "Get recommendations", description: "Your dashboard shows prioritized actions — what to do, for whom, and why." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Sparkles className="h-6 w-6 text-violet-500" />
            Area-One
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 md:py-32 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm mb-6">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Powered by DeepSeek V3
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            Your AI Revenue <span className="text-violet-500">Co-Pilot</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto">
            Area-One reads your emails, remembers every customer detail, and tells you exactly what to do next — so you close more deals with less effort.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Start free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">No credit card required · Connect in 2 minutes</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Everything you need</h2>
          <p className="text-muted-foreground mt-2">AI-powered revenue intelligence, privacy-first.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 hover:border-primary/30 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/20 mb-4">
                <f.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">How it works</h2>
          <p className="text-muted-foreground mt-2">Three steps to AI-powered revenue execution.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          {steps.map((s) => (
            <div key={s.step} className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-bold text-lg mb-4">
                {s.step}
              </div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="max-w-2xl mx-auto text-center rounded-2xl border bg-linear-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/20 dark:to-fuchsia-950/20 p-12">
          <h2 className="text-3xl font-bold">Ready to close more deals?</h2>
          <p className="text-muted-foreground mt-2 mb-6">
            Connect your email and let AI handle the busywork.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Area-One
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

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
