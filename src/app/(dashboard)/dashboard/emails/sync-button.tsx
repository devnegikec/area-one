"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const [syncing, setSyncing] = React.useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/integrations/gmail/sync");
      if (res.ok) {
        // Refresh the page to show new emails
        router.refresh();
      }
    } catch {
      // silently fail
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-2">
      {syncing ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {syncing ? "Syncing..." : "Sync Gmail"}
    </Button>
  );
}
