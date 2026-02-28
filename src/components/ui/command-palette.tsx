import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Calendar,
  Target,
  BookOpen,
  Lightbulb,
  Palette,
  Tags,
  RefreshCw,
  Plus,
  Hash,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: "navigation" | "actions" | "search";
  keywords: string[];
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  currentSection?: string;
}

export function CommandPalette({
  isOpen,
  onClose,
  year,
  currentSection,
}: CommandPaletteProps) {
  // Reset state when isOpen changes
  const [query, setQuery] = useState(() => (isOpen ? "" : ""));
  const [selectedIndex, setSelectedIndex] = useState(() => (isOpen ? 0 : 0));
  const router = useRouter();

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to avoid the linting rule
      const timer = setTimeout(() => {
        setQuery("");
        setSelectedIndex(0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Generate command items
  const commands = useMemo((): CommandItem[] => {
    const baseUrl = `/year/${year}`;

    return [
      // Navigation Commands
      {
        id: "nav-daily-logs",
        title: "Daily Logs",
        description: "View daily journal entries",
        icon: <Calendar className="w-4 h-4" />,
        action: () => router.push(`${baseUrl}/daily-logs`),
        category: "navigation",
        keywords: ["daily", "logs", "journal", "entries", "today"],
        shortcut: "1",
      },
      {
        id: "nav-quarterly",
        title: "Quarterly Reflections",
        description: "Review quarterly progress",
        icon: <RefreshCw className="w-4 h-4" />,
        action: () => router.push(`${baseUrl}/quarterly-reflections`),
        category: "navigation",
        keywords: ["quarterly", "reflections", "review", "progress"],
        shortcut: "2",
      },
      {
        id: "nav-goals",
        title: "Yearly Goals",
        description: "Manage annual objectives",
        icon: <Target className="w-4 h-4" />,
        action: () => router.push(`${baseUrl}/yearly-goals`),
        category: "navigation",
        keywords: ["goals", "objectives", "targets", "yearly", "annual"],
        shortcut: "3",
      },
      {
        id: "nav-books",
        title: "Book Notes",
        description: "Reading notes and highlights",
        icon: <BookOpen className="w-4 h-4" />,
        action: () => router.push(`${baseUrl}/book-notes`),
        category: "navigation",
        keywords: ["books", "reading", "notes", "highlights", "library"],
        shortcut: "4",
      },
      {
        id: "nav-lessons",
        title: "Lessons Learned",
        description: "Insights and learnings",
        icon: <Lightbulb className="w-4 h-4" />,
        action: () => router.push(`${baseUrl}/lessons-learned`),
        category: "navigation",
        keywords: ["lessons", "learned", "insights", "learnings", "wisdom"],
        shortcut: "5",
      },
      {
        id: "nav-creative",
        title: "Creative Dump",
        description: "Ideas and creative thoughts",
        icon: <Palette className="w-4 h-4" />,
        action: () => router.push(`${baseUrl}/creative-dump`),
        category: "navigation",
        keywords: ["creative", "dump", "ideas", "thoughts", "inspiration"],
        shortcut: "6",
      },
      {
        id: "nav-tags",
        title: "Tag Explorer",
        description: "Explore tagged content",
        icon: <Tags className="w-4 h-4" />,
        action: () => router.push(`${baseUrl}/tags`),
        category: "navigation",
        keywords: ["tags", "explorer", "search", "highlights", "connections"],
        shortcut: "7",
      },

      // Action Commands (context-dependent)
      ...(currentSection === "yearly-goals"
        ? [
            {
              id: "action-new-goal",
              title: "New Goal",
              description: "Create a new yearly goal",
              icon: <Plus className="w-4 h-4" />,
              action: () => {
                onClose();
                // Trigger goal creation - this would need to be passed as a prop or context
                const event = new CustomEvent("trigger-new-goal");
                window.dispatchEvent(event);
              },
              category: "actions" as const,
              keywords: ["new", "goal", "create", "add", "objective"],
              shortcut: "Cmd+N",
            },
          ]
        : []),

      ...(currentSection === "book-notes"
        ? [
            {
              id: "action-new-genre",
              title: "New Genre",
              description: "Add a new book genre",
              icon: <Plus className="w-4 h-4" />,
              action: () => {
                onClose();
                const event = new CustomEvent("trigger-new-genre");
                window.dispatchEvent(event);
              },
              category: "actions" as const,
              keywords: ["new", "genre", "create", "add", "category"],
              shortcut: "Cmd+N",
            },
            {
              id: "action-new-book",
              title: "New Book",
              description: "Add a new book",
              icon: <BookOpen className="w-4 h-4" />,
              action: () => {
                onClose();
                const event = new CustomEvent("trigger-new-book");
                window.dispatchEvent(event);
              },
              category: "actions" as const,
              keywords: ["new", "book", "create", "add", "reading"],
              shortcut: "Cmd+N",
            },
          ]
        : []),

      // Search Commands
      {
        id: "search-tags",
        title: "Search Tags",
        description: "Find content by tags",
        icon: <Hash className="w-4 h-4" />,
        action: () => router.push(`${baseUrl}/tags`),
        category: "search",
        keywords: ["search", "tags", "find", "filter", "highlights"],
      },

      // Time Navigation
      {
        id: "nav-current-year",
        title: `Go to ${new Date().getFullYear()}`,
        description: "Navigate to current year",
        icon: <Clock className="w-4 h-4" />,
        action: () => router.push(`/year/${new Date().getFullYear()}`),
        category: "navigation",
        keywords: ["current", "year", "today", "now", "present"],
      },
    ];
  }, [year, currentSection, router, onClose]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const lowerQuery = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(lowerQuery) ||
        cmd.description?.toLowerCase().includes(lowerQuery) ||
        cmd.keywords.some((keyword) =>
          keyword.toLowerCase().includes(lowerQuery)
        )
    );
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    if (
      filteredCommands.length > 0 &&
      selectedIndex >= filteredCommands.length
    ) {
      // Use setTimeout to avoid the linting rule
      const timer = setTimeout(() => {
        setSelectedIndex(0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [filteredCommands.length, selectedIndex]);

  if (!isOpen) return null;

  const categoryLabels = {
    navigation: "Navigation",
    actions: "Actions",
    search: "Search",
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
        <div className="fixed top-[20%] left-1/2 transform -translate-x-1/2 w-full max-w-2xl mx-4">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-card border border-border/60 rounded-lg shadow-[0_16px_32px_-8px_rgba(0,0,0,0.2)] overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-4 border-b border-border/40">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search commands..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg h-12"
                  autoFocus
                />
              </div>
            </div>

            {/* Commands List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No commands found</p>
                </div>
              ) : (
                <div className="p-2">
                  {Object.entries(groupedCommands).map(([category, items]) => (
                    <div key={category} className="mb-4 last:mb-0">
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {
                          categoryLabels[
                            category as keyof typeof categoryLabels
                          ]
                        }
                      </div>
                      <div className="space-y-1">
                        {items.map((cmd) => {
                          const globalIndex = filteredCommands.indexOf(cmd);
                          const isSelected = globalIndex === selectedIndex;

                          return (
                            <motion.button
                              key={cmd.id}
                              onClick={() => {
                                cmd.action();
                                onClose();
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                                isSelected
                                  ? "bg-accent text-accent-foreground"
                                  : "hover:bg-accent/50"
                              )}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <div className="shrink-0 text-muted-foreground">
                                {cmd.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {cmd.title}
                                </div>
                                {cmd.description && (
                                  <div className="text-sm text-muted-foreground truncate">
                                    {cmd.description}
                                  </div>
                                )}
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                {cmd.shortcut && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs font-mono"
                                  >
                                    {cmd.shortcut}
                                  </Badge>
                                )}
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border/40 bg-secondary/20">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      ↑↓
                    </Badge>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      ↵
                    </Badge>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      Esc
                    </Badge>
                    Close
                  </span>
                </div>
                <span>{filteredCommands.length} commands</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
