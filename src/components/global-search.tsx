"use client";

import * as React from "react";
import { Search, Loader2, Mail, Brain, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchResult {
  id: string;
  type: "email" | "memory";
  title: string | null;
  snippet: string | null;
  receivedAt: string;
  customerName: string | null;
}

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [answer, setAnswer] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Cmd+K / Ctrl+K to open
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search on query change (debounced)
  React.useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setAnswer(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const isAsk = query.endsWith("?");
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&mode=${isAsk ? "ask" : "search"}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setAnswer(data.answer || null);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl">
        <div className="bg-background border rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              className="border-0 bg-transparent h-auto p-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder='Search emails & memory... (end with "?" to ask AI)'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              esc
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : answer ? (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-medium">AI Answer</span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{answer}</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((r) => (
                  <div
                    key={`${r.type}-${r.id}`}
                    className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      {r.type === "email" ? (
                        <Mail className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Brain className="h-4 w-4 text-violet-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {r.title || "(no subject)"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {r.snippet}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {r.customerName && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                            {r.customerName}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {r.type === "email" ? "Email" : "Memory fact"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found for &ldquo;{query}&rdquo;
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t text-[10px] text-muted-foreground">
            <span>Press <kbd className="rounded border bg-muted px-1 py-0.5">Cmd+K</kbd> to toggle</span>
            <span>End with <kbd className="rounded border bg-muted px-1 py-0.5">?</kbd> for AI answers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
