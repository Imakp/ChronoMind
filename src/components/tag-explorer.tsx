"use client";

import { useState, useEffect } from "react";
import { getTags, getTaggedContentByTag } from "@/lib/actions";
import type { TaggedContent, TagWithCount } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Hash } from "lucide-react";
import Link from "next/link";

interface TagExplorerProps {
  userId: string;
}

export function TagExplorer({ userId }: TagExplorerProps) {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [taggedContent, setTaggedContent] = useState<TaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTags();
  }, [userId]);

  const loadTags = async () => {
    setLoading(true);
    const result = await getTags(userId);
    if (result.success && result.data) {
      // Transform the data to match TagWithCount type
      const transformedTags = result.data.map((tag) => ({
        id: tag.id,
        name: tag.name,
        highlightCount: tag._count.highlights,
      }));
      setTags(transformedTags);
    }
    setLoading(false);
  };

  const handleTagClick = async (tagId: string) => {
    setSelectedTag(tagId);
    setContentLoading(true);
    const result = await getTaggedContentByTag(userId, tagId);
    if (result.success && result.data) {
      setTaggedContent(result.data);
    }
    setContentLoading(false);
  };

  const handleBackToTags = () => {
    setSelectedTag(null);
    setTaggedContent([]);
  };

  // Helper function to generate navigation URL based on entity type
  const getSourceUrl = (source: TaggedContent["source"]) => {
    if (!source) return null;

    const { year, section } = source;

    // Map section names to route paths
    const sectionRoutes: Record<string, string> = {
      "daily-logs": "daily-logs",
      "quarterly-reflections": "quarterly-reflections",
      "yearly-goals": "yearly-goals",
      "book-notes": "book-notes",
      "lessons-learned": "lessons-learned",
      "creative-dump": "creative-dump",
    };

    const route = sectionRoutes[section];
    if (!route) return null;

    return `/year/${year}/${route}`;
  };

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTagData = tags.find((tag) => tag.id === selectedTag);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading tags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {!selectedTag ? (
        <>
          {/* Tag List View */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight mb-2">
                Tag Explorer
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Explore all your tagged content across years and sections
              </p>
            </div>

            {/* Search Bar */}
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 text-sm sm:text-base border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                />
              </CardContent>
            </Card>

            {/* Tags Grid */}
            {filteredTags.length === 0 ? (
              <Card className="border-border/60">
                <CardContent className="text-center py-12">
                  <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No tags found matching your search"
                      : "No tags yet. Start highlighting and tagging content!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag.id)}
                    className="p-4 bg-card border border-border/60 rounded-lg hover:border-primary/50 hover:shadow-md transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-medium text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">
                        #{tag.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-secondary/50 font-mono"
                      >
                        {tag.highlightCount}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Tagged Content View */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Button onClick={handleBackToTags} variant="outline" size="sm">
                ← Back to Tags
              </Button>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                  #{selectedTagData?.name}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {taggedContent.length} highlight
                  {taggedContent.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {contentLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">Loading content...</p>
                </div>
              </div>
            ) : taggedContent.length === 0 ? (
              <Card className="border-border/60">
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">
                    No content found for this tag
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {taggedContent.map((content) => (
                  <Card
                    key={content.id}
                    className="hover-elevate border-border/60"
                  >
                    <CardContent className="p-4">
                      {/* Highlighted Text - Uses database snapshot */}
                      <div className="mb-3">
                        <p className="text-base sm:text-lg font-serif italic text-foreground/90 bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                          "{content.text}"
                        </p>
                      </div>

                      {/* Source Information with Navigation */}
                      {content.source && (
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
                          <span className="font-medium font-mono">
                            {content.source.year}
                          </span>
                          <span>•</span>
                          <span className="capitalize">
                            {content.source.section.replace(/-/g, " ")}
                          </span>
                          {content.source.itemTitle && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">
                                {content.source.itemTitle}
                              </span>
                            </>
                          )}

                          {/* Navigate to Source Button */}
                          {getSourceUrl(content.source) && (
                            <>
                              <span>•</span>
                              <Link
                                href={getSourceUrl(content.source)!}
                                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                              >
                                <span>View Source</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {content.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            #{tag.name}
                          </Badge>
                        ))}
                      </div>

                      {/* Date */}
                      <div className="text-xs text-muted-foreground/70 font-mono">
                        Created{" "}
                        {new Date(content.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
