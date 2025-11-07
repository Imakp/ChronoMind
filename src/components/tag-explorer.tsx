"use client";

import { useState, useEffect } from "react";
import { getTags, getTaggedContentByTag } from "@/lib/actions";
import type { TaggedContent, TagWithCount } from "@/types";
import { Button } from "@/components/ui/button";

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

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTagData = tags.find((tag) => tag.id === selectedTag);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading tags...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!selectedTag ? (
        <>
          {/* Tag List View */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tag Explorer</h2>
              <p className="text-gray-600">
                Explore all your tagged content across years and sections
              </p>
            </div>

            {/* Search Bar */}
            <div>
              <input
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tags Grid */}
            {filteredTags.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchQuery
                    ? "No tags found matching your search"
                    : "No tags yet. Start highlighting and tagging content!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag.id)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-lg">#{tag.name}</span>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {tag.highlightCount}
                      </span>
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
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button onClick={handleBackToTags} variant="outline">
                ← Back to Tags
              </Button>
              <div>
                <h2 className="text-2xl font-bold">#{selectedTagData?.name}</h2>
                <p className="text-gray-600">
                  {taggedContent.length} highlight
                  {taggedContent.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {contentLoading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-gray-500">Loading content...</p>
              </div>
            ) : taggedContent.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No content found for this tag</p>
              </div>
            ) : (
              <div className="space-y-4">
                {taggedContent.map((content) => (
                  <div
                    key={content.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    {/* Highlighted Text */}
                    <div className="mb-3">
                      <p className="text-lg italic text-gray-700 bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                        "{content.text}"
                      </p>
                    </div>

                    {/* Source Information */}
                    {content.source && (
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">
                          {content.source.year}
                        </span>
                        <span>•</span>
                        <span className="capitalize">
                          {content.source.section.replace(/-/g, " ")}
                        </span>
                        <span>•</span>
                        <span>{content.source.itemTitle}</span>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {content.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>

                    {/* Date */}
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(content.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
