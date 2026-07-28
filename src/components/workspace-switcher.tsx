"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceData[];
  currentSlug?: string;
}

export function WorkspaceSwitcher({ workspaces, currentSlug }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");

  const current = workspaces.find((w) => w.slug === currentSlug) || workspaces[0];

  const handleSwitch = (slug: string) => {
    router.push(`/dashboard?workspace=${slug}`);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        const ws = await res.json();
        setIsCreating(false);
        setNewName("");
        handleSwitch(ws.slug);
      }
    } catch {
      // silently fail
    }
  };

  if (workspaces.length === 0) {
    return (
      <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => setIsCreating(true)}>
        <Plus className="h-4 w-4" />
        Create Workspace
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="justify-between gap-2 w-full max-w-[200px]">
          <span className="truncate">{current?.name || "Select Workspace"}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => handleSwitch(ws.slug)}
            className="flex items-center justify-between"
          >
            <span className="truncate">{ws.name}</span>
            {ws.slug === currentSlug && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {isCreating ? (
          <div className="flex items-center gap-2 p-1">
            <Input
              placeholder="Workspace name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={handleCreate}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <DropdownMenuItem onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workspace
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
