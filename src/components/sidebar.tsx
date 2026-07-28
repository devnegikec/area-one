"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Mail,
  Calendar,
  BarChart3,
  Settings,
  HelpCircle,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { cn } from "@/lib/utils";

// ─── Navigation Items ───────────────────────────────────────────

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Customers", href: "/dashboard/customers", icon: Users },
  { title: "Emails", href: "/dashboard/emails", icon: Mail },
  { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { title: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
  { title: "Reports", href: "/dashboard/reports", icon: BarChart3 },
];

const bottomNavItems: NavItem[] = [
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
  { title: "Help", href: "/dashboard/help", icon: HelpCircle },
];

// ─── Sidebar Props ──────────────────────────────────────────────

interface SidebarProps {
  open?: boolean;
  collapsed?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

// ─── Sidebar Nav Item ───────────────────────────────────────────

function SidebarNavItem({
  item,
  isActive,
  collapsed,
  isMobile,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  isMobile: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip key={item.href} delayDuration={0}>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          onClick={onClick}
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive
              ? "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            collapsed && !isMobile && "justify-center px-2"
          )}
        >
          <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-violet-500 dark:text-violet-400")} />
          {(!collapsed || isMobile) && <span>{item.title}</span>}
        </Link>
      </TooltipTrigger>
      {collapsed && !isMobile && (
        <TooltipContent side="right" className="flex items-center gap-4">
          {item.title}
        </TooltipContent>
      )}
    </Tooltip>
  );
}

// ─── Sidebar Component ──────────────────────────────────────────

export function Sidebar({ open = true, collapsed = false, isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Mobile overlay
  if (isMobile) {
    if (!open) return null;
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background">
          <SidebarContent collapsed={false} isMobile pathname={pathname} onNavClick={onClose} />
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-[70px]" : "w-64"
      )}
    >
      <SidebarContent collapsed={collapsed} isMobile={false} pathname={pathname} />
    </aside>
  );
}

// ─── Sidebar Content ────────────────────────────────────────────

function SidebarContent({
  collapsed,
  isMobile,
  pathname,
  onNavClick,
}: {
  collapsed: boolean;
  isMobile: boolean;
  pathname: string;
  onNavClick?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b px-4", collapsed && !isMobile && "justify-center px-2")}>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-bold">
            A1
          </div>
          {(!collapsed || isMobile) && <span className="text-lg">Area-One</span>}
        </Link>
      </div>

      {/* Workspace Switcher (desktop, expanded) */}
      {!collapsed && !isMobile && (
        <div className="px-3 py-2">
          <WorkspaceSwitcher workspaces={[]} />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
              collapsed={collapsed}
              isMobile={isMobile}
              onClick={onNavClick}
            />
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname.startsWith(item.href)}
              collapsed={collapsed}
              isMobile={isMobile}
              onClick={onNavClick}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      {(!collapsed || isMobile) && (
        <div className="border-t p-3">
          <p className="text-xs text-muted-foreground text-center">Area-One v0.1.0</p>
        </div>
      )}
    </div>
  );
}
