"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, Settings, FolderTree, History, PanelLeftClose, PanelLeft, MessageCircle, PenLine, Network } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200 shrink-0",
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

      <nav className="flex-1 flex flex-col gap-1 p-2">
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
    </aside>
  );
}
