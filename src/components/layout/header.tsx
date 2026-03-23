"use client";

import { useSession, signOut } from "next-auth/react";
import { Music, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  Wand2,
  Piano,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/themes", label: "Themes", icon: Palette },
  { href: "/generate", label: "Generate", icon: Wand2 },
  { href: "/synthesizer", label: "Synthesizer", icon: Piano },
  { href: "/library", label: "Library", icon: Library },
];

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
              <Music className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">SoundForge</span>
            </div>
            <nav className="px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-1" />

      {session?.user && (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors">
            <Avatar className="h-7 w-7">
              <AvatarImage src={session.user.image ?? undefined} />
              <AvatarFallback>
                {session.user.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm">
              {session.user.name}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
