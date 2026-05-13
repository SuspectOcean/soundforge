"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  Wand2,
  Piano,
  Library,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/themes", label: "Themes", icon: Palette },
  { href: "/generate", label: "Generate", icon: Wand2 },
  { href: "/synthesizer", label: "Synthesizer", icon: Piano },
  { href: "/library", label: "Library", icon: Library },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
        <div className="rounded-lg bg-primary/10 p-1.5">
          <Music className="h-5 w-5 text-primary" />
        </div>
        <span className="text-lg font-bold">SoundForge</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          SoundForge v0.1
        </p>
      </div>
    </aside>
  );
}
