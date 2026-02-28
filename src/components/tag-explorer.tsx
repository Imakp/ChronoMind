"use client";

import { useState, useEffect, useCallback } from "react";
import { getTagsForYear, getTaggedContentByTagAndYear } from "@/lib/actions";
import type { TaggedContent } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Hash,
  BookOpen,
  Calendar,
  PenTool,
  Target,
  Lightbulb,
  Sparkles,
  Search,
  ExternalLink,
  Loader2,
  LucideIcon,
  Filter,
  SortAsc,
  Clock,
  TrendingUp,
  List,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TagExplorerEmpty } from "@/components/empty-states";

interface TagWithCount {
  id: string;
  name: string;
  count: number;
  lastUsed?: Date | null;
}

interface TagExplorerProps {
  userId: string;
  year: number;
  initialTags?: TagWithCount[];
  initialSelectedTagId?: string | null;
  initialContent?: TaggedContent[];
}

const iconMap: Record<string, LucideIcon> = {
  "daily-logs": Calendar,
  "book-notes": BookOpen,
  "quarterly-reflections": PenTool,
  "yearly-goals": Target,
  "lessons-learned": Lightbulb,
  "creative-dump": Sparkles,
};

export function TagExplorer({
  userId,
  year,
  initialTags,
  initialSelectedTagId,
  initialContent,
}: TagExplorerProps) {
  const [tags, setTags] = useState<TagWithCount[]>(initialTags || []);
  const [selectedTag, setSelectedTag] = useState<string | null>(
    initialSelectedTagId || null
  );
  const [taggedContent, setTaggedContent] = useState<TaggedContent[]>(
    initialContent || []
  );
  const [tagsLoading, setTagsLoading] = useState(!initialTags);
  const [contentLoading, setContentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"alphabetical" | "usage" | "recent">(
    "alphabetical"
  );
  const [view, setView] = useState<"list" | "timeline">("list");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const handleTagClick = useCallback(
    async (tagId: string) => {
      setSelectedTag(tagId);
      setMobileSheetOpen(false); // Close mobile drawer on selection
      setContentLoading(true);
      const result = await getTaggedContentByTagAndYear(userId, tagId, year);
      if (result.success && result.data) {
        setTaggedContent(result.data);
      }
      setContentLoading(false);
    },
    [userId, year]
  );

  // Load tags if not provided initially
  useEffect(() => {
    if (initialTags) {
      setTags(initialTags);
      setTagsLoading(false);
      return;
    }

    const loadTags = async () => {
      setTagsLoading(true);
      const result = await getTagsForYear(userId, year);
      if (result.success && result.data) {
        setTags(
          result.data.map(
            (t: {
              id: string;
              name: string;
              _count: { highlights: number };
              lastUsed: Date | null;
            }) => ({
              id: t.id,
              name: t.name,
              count: t._count.highlights,
              lastUsed: t.lastUsed,
            })
          )
        );
        // Auto-select first tag if available and nothing selected
        if (result.data.length > 0 && !selectedTag) {
          handleTagClick(result.data[0].id);
        }
      }
      setTagsLoading(false);
    };
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, year, initialTags]);

  const getSourceUrl = (source: TaggedContent["source"]) => {
    if (!source) return "#";
    return `/year/${source.year}/${source.section}`;
  };

  const filteredTags = tags
    .filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "usage":
          return b.count - a.count;
        case "recent":
          if (!a.lastUsed && !b.lastUsed) return 0;
          if (!a.lastUsed) return 1;
          if (!b.lastUsed) return -1;
          return (
            new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
          );
        case "alphabetical":
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const activeTagName = tags.find((t) => t.id === selectedTag)?.name;

  // Timeline View Component
  const TimelineView = () => {
    // Group tags by month for timeline display
    const timelineData = filteredTags.reduce((acc, tag) => {
      if (!tag.lastUsed) return acc;

      const monthKey = new Date(tag.lastUsed).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });

      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(tag);
      return acc;
    }, {} as Record<string, TagWithCount[]>);

    const sortedMonths = Object.keys(timelineData).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    return (
      <div className="space-y-6">
        {sortedMonths.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No timeline data available.
          </div>
        ) : (
          sortedMonths.map((month) => (
            <div key={month} className="space-y-3">
              <h3 className="font-serif text-lg font-medium text-foreground border-b border-border pb-2">
                {month}
              </h3>
              <div className="flex flex-wrap gap-2">
                {timelineData[month].map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag.id)}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all duration-300 hover:shadow-sm border",
                      selectedTag === tag.id
                        ? "bg-accent text-accent-foreground border-accent/20 shadow-sm"
                        : "bg-card text-card-foreground border-border hover:bg-accent/10 hover:border-accent/30"
                    )}
                    style={{
                      // Size proportional to highlight count (min 1rem, max 2rem)
                      fontSize: `${Math.min(
                        Math.max(0.75 + (tag.count / 20) * 0.5, 0.75),
                        1.25
                      )}rem`,
                    }}
                  >
                    <Hash className="w-3 h-3 opacity-70" />
                    <span className="font-medium">{tag.name}</span>
                    <span className="font-mono text-xs opacity-75 bg-background/50 px-1.5 py-0.5 rounded">
                      {tag.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // Reusable Tag List Component
  const TagList = ({ isMobile = false }) => (
    <div className={cn("space-y-1", isMobile ? "mt-4" : "")}>
      {tagsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 rounded-full loading-skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 loading-skeleton rounded w-3/4" />
                <div className="h-3 loading-skeleton rounded w-1/2" />
              </div>
              <div className="w-12 h-3 loading-skeleton rounded" />
            </div>
          ))}
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No tags found{searchQuery ? " matching your search" : ""}.
        </div>
      ) : (
        filteredTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagClick(tag.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-3 rounded-md text-sm transition-all duration-300 group hover:shadow-sm",
              selectedTag === tag.id
                ? "bg-accent text-accent-foreground shadow-sm border border-accent/20"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
            )}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Hash className="w-3.5 h-3.5 opacity-70 shrink-0" />
              <div className="min-w-0 flex-1 text-left">
                <div
                  className={cn(
                    "font-medium truncate",
                    "font-sans", // Inter Medium for tag names
                    selectedTag === tag.id
                      ? "text-accent-foreground"
                      : "text-foreground"
                  )}
                >
                  {tag.name}
                </div>
                {tag.lastUsed && (
                  <div
                    className={cn(
                      "text-xs opacity-75 font-mono", // JetBrains Mono for timestamps
                      selectedTag === tag.id
                        ? "text-accent-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {new Date(tag.lastUsed).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  "text-xs font-mono px-2 py-1 rounded-full min-w-[2rem] text-center",
                  selectedTag === tag.id
                    ? "bg-accent-foreground/20 text-accent-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-background"
                )}
              >
                {tag.count}
              </span>
            </div>
          </button>
        ))
      )}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full min-h-[calc(100vh-140px)] animate-in fade-in duration-500">
      {/* Show empty state if no tags exist */}
      {!tagsLoading && tags.length === 0 ? (
        <TagExplorerEmpty
          year={year}
          onExploreContent={() => {
            // Navigate to daily logs to start creating content
            window.location.href = `/year/${year}/daily-logs`;
          }}
        />
      ) : (
        <>
          {/* --- Mobile: Sticky Tag Selector Bar --- */}
          <div className="md:hidden flex items-center justify-between bg-card border border-border p-3 rounded-lg shadow-sm mb-2 sticky top-0 z-10">
            <div className="flex items-center gap-2 overflow-hidden">
              {selectedTag ? (
                <Badge
                  variant="secondary"
                  className="text-sm py-1 px-3 truncate max-w-[200px] border-primary/20 bg-primary/5 text-primary"
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {activeTagName}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Select a tag...
                </span>
              )}
            </div>
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
                <SheetHeader className="mb-4 text-left">
                  <SheetTitle>Browse Tags</SheetTitle>
                </SheetHeader>

                {/* Search Input */}
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-secondary/30"
                  />
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-2 mb-4">
                  <SortAsc className="w-4 h-4 text-muted-foreground" />
                  <Select
                    value={sortBy}
                    onValueChange={(
                      value: "alphabetical" | "usage" | "recent"
                    ) => setSortBy(value)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alphabetical">
                        <div className="flex items-center gap-2">
                          <SortAsc className="w-3 h-3" />
                          Alphabetical
                        </div>
                      </SelectItem>
                      <SelectItem value="usage">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3" />
                          Usage Count
                        </div>
                      </SelectItem>
                      <SelectItem value="recent">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          Recent Activity
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Switcher */}
                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg mb-4">
                  <button
                    onClick={() => setView("list")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300",
                      view === "list"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <List className="w-3 h-3" />
                    List
                  </button>
                  <button
                    onClick={() => setView("timeline")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300",
                      view === "timeline"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <BarChart3 className="w-3 h-3" />
                    Timeline
                  </button>
                </div>

                <div className="overflow-y-auto h-[calc(100%-200px)] -mx-6 px-6">
                  {view === "list" ? (
                    <TagList isMobile={true} />
                  ) : (
                    <TimelineView />
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* --- Desktop: Vertical Sidebar --- */}
          <div className="hidden md:flex w-72 flex-none flex-col gap-4 border-r border-border pr-6">
            <div>
              <h2 className="font-serif text-2xl font-medium mb-1 text-foreground">
                Tags
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Explore {year} via your highlights.
              </p>

              {/* Search Input */}
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2 mb-4">
                <SortAsc className="w-4 h-4 text-muted-foreground" />
                <Select
                  value={sortBy}
                  onValueChange={(value: "alphabetical" | "usage" | "recent") =>
                    setSortBy(value)
                  }
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alphabetical">
                      <div className="flex items-center gap-2">
                        <SortAsc className="w-3 h-3" />
                        Alphabetical
                      </div>
                    </SelectItem>
                    <SelectItem value="usage">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        Usage Count
                      </div>
                    </SelectItem>
                    <SelectItem value="recent">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Recent Activity
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg mb-4">
                <button
                  onClick={() => setView("list")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300",
                    view === "list"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="w-3 h-3" />
                  List
                </button>
                <button
                  onClick={() => setView("timeline")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300",
                    view === "timeline"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BarChart3 className="w-3 h-3" />
                  Timeline
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin">
              {view === "list" ? <TagList /> : <TimelineView />}
            </div>
          </div>

          {/* --- Main Content Feed --- */}
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {/* Desktop Header */}
            <div className="hidden md:block mb-6 flex-none">
              {selectedTag ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="text-base px-4 py-1.5 font-mono font-normal bg-secondary/20"
                      >
                        #{activeTagName}
                      </Badge>
                      <span className="text-muted-foreground text-sm">
                        {taggedContent.length} highlight
                        {taggedContent.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Tag Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => {
                          // TODO: Implement tag editing
                          console.log("Edit tag:", activeTagName);
                        }}
                      >
                        Edit Tag
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => {
                          // TODO: Implement tag connections
                          console.log("Connect tags for:", activeTagName);
                        }}
                      >
                        Connect Tags
                      </Button>
                    </div>
                  </div>

                  {/* Tag Connections Preview */}
                  {taggedContent.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        new Set(
                          taggedContent
                            .flatMap((item) => item.tags)
                            .filter((tag) => tag.id !== selectedTag)
                            .map((tag) => tag.name)
                        )
                      )
                        .slice(0, 5)
                        .map((tagName) => (
                          <Badge
                            key={tagName}
                            variant="secondary"
                            className="text-xs px-2 py-1 bg-accent/20 text-accent-foreground hover:bg-accent/30 cursor-pointer transition-colors"
                            onClick={() => {
                              const tag = tags.find((t) => t.name === tagName);
                              if (tag) handleTagClick(tag.id);
                            }}
                          >
                            #{tagName}
                          </Badge>
                        ))}
                      {Array.from(
                        new Set(
                          taggedContent
                            .flatMap((item) => item.tags)
                            .filter((tag) => tag.id !== selectedTag)
                        )
                      ).length > 5 && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-1"
                        >
                          +
                          {Array.from(
                            new Set(
                              taggedContent
                                .flatMap((item) => item.tags)
                                .filter((tag) => tag.id !== selectedTag)
                            )
                          ).length - 5}{" "}
                          more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-9 flex items-center text-muted-foreground">
                  Select a tag to view highlights
                </div>
              )}
            </div>

            {/* Highlights Feed */}
            <div className="flex-1">
              {contentLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : !selectedTag ? (
                <div className="hidden md:flex flex-col items-center justify-center h-64 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-secondary/5">
                  <Hash className="w-12 h-12 mb-4 opacity-20" />
                  <p>Select a tag from the sidebar to explore your insights.</p>
                </div>
              ) : taggedContent.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  No highlights found for this tag in {year}.
                </div>
              ) : (
                <div className="space-y-6 pb-20">
                  <AnimatePresence mode="popLayout">
                    {taggedContent.map((item, i) => {
                      const Icon = item.source
                        ? iconMap[item.source.section] || BookOpen
                        : BookOpen;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Card className="hover:shadow-sm transition-all duration-300 border-border/60 hover:border-primary/30 group">
                            <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground overflow-hidden">
                                  <div className="p-1.5 bg-secondary rounded-md shrink-0">
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-medium text-foreground/80 truncate">
                                    {item.source?.itemTitle || "Unknown Source"}
                                  </span>
                                  {item.source?.section !== "daily-logs" && (
                                    <>
                                      <span className="opacity-50 shrink-0">
                                        •
                                      </span>
                                      <span className="shrink-0">
                                        {new Date(
                                          item.createdAt
                                        ).toLocaleDateString()}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {item.source && (
                                  <Link
                                    href={getSourceUrl(item.source)}
                                    className="shrink-0"
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-5 pb-5">
                              <blockquote className="font-serif text-base sm:text-lg leading-relaxed border-l-4 border-accent/50 pl-4 py-1 text-foreground/90 bg-accent/10 rounded-r-lg">
                                &quot;{item.text}&quot;
                              </blockquote>
                              {item.tags.length > 1 && (
                                <div className="flex flex-wrap gap-2 mt-3 pl-5">
                                  {item.tags
                                    .filter((t) => t.id !== selectedTag)
                                    .map((t) => (
                                      <span
                                        key={t.id}
                                        className="text-xs text-muted-foreground bg-accent/20 px-1.5 py-0.5 rounded cursor-pointer hover:text-accent-foreground hover:bg-accent/30 transition-colors"
                                        onClick={() => handleTagClick(t.id)}
                                      >
                                        #{t.name}
                                      </span>
                                    ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
