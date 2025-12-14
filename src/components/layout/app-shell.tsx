"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Calendar,
  Hash,
  Target,
  Lightbulb,
  PenTool,
  Menu,
  LogOut,
  Tag,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import { YearSwitcher } from "@/components/navigation/year-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react"; 

interface AppShellProps {
  children: React.ReactNode;
  year: number;
  userId: string;
}


interface SidebarContentProps {
  year: number;
  userId: string;
  setMobileOpen: (open: boolean) => void;
}

function SidebarContent({ year, userId, setMobileOpen }: SidebarContentProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navigation = [
    { name: "Daily Logs", href: `/year/${year}/daily-logs`, icon: Calendar },
    {
      name: "Reflections",
      href: `/year/${year}/quarterly-reflections`,
      icon: PenTool,
    },
    { name: "Goals", href: `/year/${year}/yearly-goals`, icon: Target },
    { name: "Books", href: `/year/${year}/book-notes`, icon: BookOpen },
    { name: "Lessons", href: `/year/${year}/lessons-learned`, icon: Lightbulb },
    { name: "Creative", href: `/year/${year}/creative-dump`, icon: Hash },
    { name: "Tags", href: `/year/${year}/tags`, icon: Tag },
  ];

  return (
    <div className="flex flex-col h-full py-6 bg-secondary/30 border-r border-border">
      {/* Brand */}
      <div className="px-6 mb-8">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-serif font-bold text-xl">
            C
          </div>
          <span className="font-serif font-bold text-xl tracking-tight">
            ChronoMind
          </span>
        </Link>
      </div>

      {/* Context Switcher (Year) */}
      <div className="px-4 mb-6">
        <div className="bg-background border border-border/60 rounded-lg p-3 shadow-sm">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">
            Current Timeline
          </label>
          <YearSwitcher userId={userId} />
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
            >
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User */}
      <div className="px-4 mt-auto border-t border-border pt-4">
        {/* User Info */}
        <div className="flex items-center gap-3 px-2 mb-4">
          <Avatar className="h-9 w-9 border border-border">
            {session?.user?.image && (
              <AvatarImage
                src={session.user.image}
                alt={session.user.name || "User"}
              />
            )}
            <AvatarFallback className="bg-background text-muted-foreground">
              {session?.user?.name?.[0]?.toUpperCase() || (
                <User className="w-4 h-4" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate text-foreground">
              {session?.user?.name || "User"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {session?.user?.email}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-red-600 gap-2"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children, year, userId }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 z-50">
        <SidebarContent year={year} userId={userId} setMobileOpen={setMobileOpen} />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-serif font-bold text-xl">
            C
          </div>
          <span className="font-serif font-bold text-lg">
            ChronoMind
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border">
            <SidebarContent year={year} userId={userId} setMobileOpen={setMobileOpen} />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 transition-all duration-300">
        <div className="container max-w-5xl mx-auto px-4 py-20 md:py-12 animate-in-up">
          {children}
        </div>
      </main>
    </div>
  );
}
