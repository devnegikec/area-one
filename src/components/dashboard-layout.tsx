"use client";

import * as React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { GlobalSearch } from "@/components/global-search";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  const handleToggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  const handleCloseSidebar = React.useCallback(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Detect mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Keyboard shortcut: Cmd+B to toggle sidebar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleSidebar]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="areaone-theme">
      <TooltipProvider delayDuration={0}>
        <div className="flex h-screen overflow-hidden bg-background">
          <GlobalSearch />
          {/* Sidebar */}
          <Sidebar
            open={sidebarOpen}
            collapsed={sidebarCollapsed}
            isMobile={isMobile}
            onClose={handleCloseSidebar}
          />

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar sidebarCollapsed={sidebarCollapsed} onToggleSidebar={handleToggleSidebar} />

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto p-6">{children}</div>
            </main>
          </div>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
