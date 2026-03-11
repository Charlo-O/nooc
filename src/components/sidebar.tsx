"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, Settings, FolderTree, History, PanelLeftClose, PanelLeft, MessageCircle, PenLine, Network, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProcessStore } from "@/hooks/use-process-store";

const COLLAPSED_KEY = "nooc-sidebar-collapsed";

const navItems = [
  { href: "/", label: "首页", icon: BookOpen },
  { href: "/settings", label: "API 设置", icon: Settings },
  { href: "/history", label: "历史记录", icon: History },
  { href: "/results", label: "查看结果", icon: FolderTree },
  { href: "/graph", label: "知识图谱", icon: Network },
  { href: "/chat", label: "角色聊天", icon: MessageCircle },
  { href: "/write", label: "创作模式", icon: PenLine },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { isRunning, steps } = useProcessStore();
  const doneCount = steps.filter((s) => s.status === "done").length;

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSED_KEY, String(next));
  };

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-[48px]" : "w-[240px]"
      )}
    >
      <div className={cn("flex items-center border-b h-14 px-3", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <Link href="/" className="font-bold text-lg truncate">
            Nooc
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={toggle} className="h-8 w-8 shrink-0">
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="soft-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {isRunning && (
        <div className="border-t p-2">
          <Link
            href="/process"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent text-blue-500",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? `流水线处理中 ${doneCount}/4` : undefined}
          >
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            {!collapsed && <span>处理中 {doneCount}/4</span>}
          </Link>
        </div>
      )}
    </aside>
  );
}
