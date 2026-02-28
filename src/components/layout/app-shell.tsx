"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/ui/command-palette";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
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
import { AutoBreadcrumb } from "@/components/navigation/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { OnboardingTooltip } from "@/components/onboarding/onboarding-tooltip";

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
    {
      name: "Daily Logs",
      href: `/year/${year}/daily-logs`,
      icon: Calendar,
      shortcut: "1",
    },
    {
      name: "Reflections",
      href: `/year/${year}/quarterly-reflections`,
      icon: PenTool,
      shortcut: "2",
    },
    {
      name: "Goals",
      href: `/year/${year}/yearly-goals`,
      icon: Target,
      shortcut: "3",
    },
    {
      name: "Books",
      href: `/year/${year}/book-notes`,
      icon: BookOpen,
      shortcut: "4",
    },
    {
      name: "Lessons",
      href: `/year/${year}/lessons-learned`,
      icon: Lightbulb,
      shortcut: "5",
    },
    {
      name: "Creative",
      href: `/year/${year}/creative-dump`,
      icon: Hash,
      shortcut: "6",
    },
    { name: "Tags", href: `/year/${year}/tags`, icon: Tag, shortcut: "7" },
  ];

  return (
    <div className="flex flex-col h-full py-8 bg-secondary/30 border-r border-border">
      {/* Brand */}
      <div className="px-8 mb-12" data-onboarding="brand">
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

      {/* Year Switcher - Desktop Only */}
      <div
        className="hidden md:flex md:w-full px-6 mb-6"
        data-onboarding="year-switcher"
      >
        <YearSwitcher userId={userId} />
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-6 space-y-2" data-onboarding="navigation">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              data-onboarding={item.name.toLowerCase().replace(/\s+/g, "-")}
            >
              <div
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 group",
                  isActive
                    ? "bg-accent text-foreground shadow-sm border border-accent/50"
                    : "text-muted-foreground hover:bg-accent/20 hover:text-foreground hover:shadow-sm"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={cn(
                      "w-4 h-4",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {item.name}
                </div>
                {/* Keyboard shortcut indicator */}
                <span
                  className={cn(
                    "text-xs font-mono px-1.5 py-0.5 rounded border transition-all duration-300",
                    isActive
                      ? "bg-background/60 text-muted-foreground border-border/60"
                      : "bg-muted/40 text-muted-foreground/60 border-border/40 group-hover:bg-background/60 group-hover:text-muted-foreground"
                  )}
                >
                  {item.shortcut}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User */}
      <div className="px-6 mt-auto border-t border-border pt-6">
        {/* User Info */}
        <div className="flex items-center gap-4 px-2 mb-6">
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
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    {
      name: "Daily Logs",
      href: `/year/${year}/daily-logs`,
      icon: Calendar,
      shortcut: "1",
    },
    {
      name: "Reflections",
      href: `/year/${year}/quarterly-reflections`,
      icon: PenTool,
      shortcut: "2",
    },
    {
      name: "Goals",
      href: `/year/${year}/yearly-goals`,
      icon: Target,
      shortcut: "3",
    },
    {
      name: "Books",
      href: `/year/${year}/book-notes`,
      icon: BookOpen,
      shortcut: "4",
    },
    {
      name: "Lessons",
      href: `/year/${year}/lessons-learned`,
      icon: Lightbulb,
      shortcut: "5",
    },
    {
      name: "Creative",
      href: `/year/${year}/creative-dump`,
      icon: Hash,
      shortcut: "6",
    },
    { name: "Tags", href: `/year/${year}/tags`, icon: Tag, shortcut: "7" },
  ];

  // Get current section from pathname
  const currentSection = pathname.split("/").pop() || "";

  // List of sections that handle their own breadcrumbs to avoid duplicates
  const sectionsWithCustomBreadcrumbs = ["book-notes"];
  const showAutoBreadcrumb =
    !sectionsWithCustomBreadcrumbs.includes(currentSection);

  // Use keyboard shortcuts hook
  const { shortcuts } = useKeyboardShortcuts({
    year,
    onCommandPalette: () => setShowCommandPalette(true),
    onNewEntry: () => {
      // Dispatch custom events for section-specific new entry actions
      const event = new CustomEvent(`trigger-new-${currentSection}`);
      window.dispatchEvent(event);
    },
    onTagging: () => {
      // Dispatch tagging event
      const event = new CustomEvent("trigger-tagging");
      window.dispatchEvent(event);
    },
    onShowShortcuts: () => setShowKeyboardShortcuts(true),
    currentSection,
  });

  // Handle escape key for closing overlays
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowKeyboardShortcuts(false);
        setShowCommandPalette(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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
        <SidebarContent
          year={year}
          userId={userId}
          setMobileOpen={setMobileOpen}
        />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-serif font-bold text-xl">
            C
          </div>
          <span className="font-serif font-bold text-lg">ChronoMind</span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Year Switcher - Mobile Only */}
          <div className="md:hidden">
            <YearSwitcher userId={userId} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border">
            <SidebarContent
              year={year}
              userId={userId}
              setMobileOpen={setMobileOpen}
            />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 transition-all duration-300">
        <div className="container max-w-5xl mx-auto px-6 py-24 md:py-12 animate-in-up space-baseline-grid-lg">
          {/* Only show AutoBreadcrumb if the section doesn't provide its own */}
          {showAutoBreadcrumb && <AutoBreadcrumb className="mb-8" />}
          {children}
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        year={year}
        currentSection={currentSection}
      />

      {/* Keyboard Shortcuts Overlay */}
      {showKeyboardShortcuts && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowKeyboardShortcuts(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-surface border border-border/60 rounded-lg shadow-[0_16px_32px_-8px_rgba(0,0,0,0.2)] p-6 max-w-lg w-full mx-4">
            <h3 className="font-serif text-lg font-semibold mb-4 text-foreground">
              Keyboard Shortcuts
            </h3>
            <div className="space-y-4">
              {shortcuts.map((category) => (
                <div key={category.category}>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {category.category}
                  </h4>
                  <div className="space-y-1">
                    {category.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-1"
                      >
                        <span className="text-sm text-foreground">
                          {item.description}
                        </span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-muted text-muted-foreground rounded border border-border/60">
                          {item.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Onboarding Tooltip */}
      <OnboardingTooltip />
    </div>
  );
}
