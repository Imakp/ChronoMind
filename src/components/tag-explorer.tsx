"use client";

import { useState, useEffect } from "react";
import { getTagsForYear, getTaggedContentByTagAndYear } from "@/lib/actions";
import type { TaggedContent } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TagWithCount {
  id: string;
  name: string;
  count: number;
}

interface TagExplorerProps {
  userId: string;
  year: number;
}

const iconMap: Record<string, any> = {
  "daily-logs": Calendar,
  "book-notes": BookOpen,
  "quarterly-reflections": PenTool,
  "yearly-goals": Target,
  "lessons-learned": Lightbulb,
  "creative-dump": Sparkles,
};

export function TagExplorer({ userId, year }: TagExplorerProps) {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [taggedContent, setTaggedContent] = useState<TaggedContent[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load tags specifically for this year
  useEffect(() => {
    const loadTags = async () => {
      setTagsLoading(true);
      const result = await getTagsForYear(userId, year);
      if (result.success && result.data) {
        setTags(
          result.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            count: t._count.highlights, // Uses the filtered count from server
          }))
        );
        // Auto-select first tag if available
        if (result.data.length > 0 && !selectedTag) {
          handleTagClick(result.data[0].id);
        }
      }
      setTagsLoading(false);
    };
    loadTags();
  }, [userId, year]);

  const handleTagClick = async (tagId: string) => {
    setSelectedTag(tagId);
    setContentLoading(true);
    const result = await getTaggedContentByTagAndYear(userId, tagId, year);
    if (result.success && result.data) {
      setTaggedContent(result.data);
    }
    setContentLoading(false);
  };

  // Helper to get URL
  const getSourceUrl = (source: TaggedContent["source"]) => {
    if (!source) return "#";
    return `/year/${source.year}/${source.section}`;
  };

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeTagName = tags.find((t) => t.id === selectedTag)?.name;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full max-h-[calc(100vh-140px)] animate-in fade-in duration-500">
      {/* --- Sidebar: Tag List --- */}
      <div className="w-full md:w-72 flex-none flex flex-col gap-4">
        <div>
          <h2 className="font-serif text-2xl font-medium mb-1 text-foreground">
            Tags
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Explore {year} via your highlights.
          </p>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        {/* Mobile: Horizontal Chips */}
        <div className="md:hidden flex overflow-x-auto pb-2 gap-2 -mx-4 px-4 scrollbar-hide">
          {tagsLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 w-20 bg-muted animate-pulse rounded-full"
                />
              ))}
            </div>
          ) : (
            filteredTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag.id)}
                className={cn(
                  "flex-none flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors",
                  selectedTag === tag.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary"
                )}
              >
                <Hash className="w-3 h-3 opacity-70" />
                <span>{tag.name}</span>
                <span className="text-xs opacity-60 font-mono ml-1">
                  {tag.count}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Desktop: Vertical List */}
        <div className="hidden md:block flex-1 overflow-y-auto pr-2 -mr-2">
          {tagsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-9 w-full bg-muted/50 animate-pulse rounded-md"
                />
              ))}
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No tags found in {year}.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagClick(tag.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-200 group",
                    selectedTag === tag.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 opacity-70" />
                    <span>{tag.name}</span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-mono px-1.5 py-0.5 rounded",
                      selectedTag === tag.id
                        ? "bg-primary-foreground/20"
                        : "bg-muted group-hover:bg-background"
                    )}
                  >
                    {tag.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- Main Content: Highlights Feed --- */}
      <div className="flex-1 flex flex-col min-w-0 h-full border-t md:border-t-0 md:border-l border-border md:pl-6 pt-6 md:pt-0">
        {/* Header */}
        <div className="mb-6 flex-none">
          {selectedTag ? (
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
            </div>
          ) : (
            <div className="h-9 flex items-center text-muted-foreground">
              Select a tag to view highlights
            </div>
          )}
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto pr-4 -mr-4">
          {contentLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !selectedTag ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-secondary/5">
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
                      <Card className="hover:shadow-sm transition-all duration-200 border-border/60 hover:border-primary/30 group">
                        <CardHeader className="pb-3 pt-4 px-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <div className="p-1.5 bg-secondary rounded-md">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-medium text-foreground/80">
                                {item.source?.itemTitle || "Unknown Source"}
                              </span>
                              <span className="opacity-50">•</span>
                              <span>
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {item.source && (
                              <Link href={getSourceUrl(item.source)}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="px-5 pb-5">
                          <blockquote className="font-serif text-lg leading-relaxed border-l-4 border-yellow-400/50 pl-4 py-1 text-foreground/90 bg-yellow-50/30 rounded-r-lg">
                            "{item.text}"
                          </blockquote>
                          {/* Related Tags */}
                          {item.tags.length > 1 && (
                            <div className="flex flex-wrap gap-2 mt-3 pl-5">
                              {item.tags
                                .filter((t) => t.id !== selectedTag)
                                .map((t) => (
                                  <span
                                    key={t.id}
                                    className="text-xs text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded cursor-pointer hover:text-primary"
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
    </div>
  );
}
