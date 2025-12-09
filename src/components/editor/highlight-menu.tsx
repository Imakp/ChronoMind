"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HighlightMenuProps {
  position: { x: number; y: number };
  selectedText: string;
  existingTags?: string[];
  onTagsAssign: (tags: string[]) => void;
  onClose: () => void;
}

/**
 * Purely presentational component for tagging highlighted text.
 * All business logic (persistence, state management) is handled by the parent.
 */
export function HighlightMenu({
  position,
  selectedText,
  existingTags = [],
  onTagsAssign,
  onClose,
}: HighlightMenuProps) {
  const [tags, setTags] = useState<string[]>(existingTags);
  const [inputValue, setInputValue] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when menu opens
    inputRef.current?.focus();

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Adjust menu position to prevent off-screen rendering
  useEffect(() => {
    if (!menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position if menu goes off-screen
    if (rect.right > viewportWidth) {
      const overflow = rect.right - viewportWidth;
      menu.style.left = `${position.x - overflow - 10}px`;
    }

    // Adjust vertical position if menu goes off-screen
    if (rect.bottom > viewportHeight) {
      const overflow = rect.bottom - viewportHeight;
      menu.style.top = `${position.y - overflow - 10}px`;
    }
  }, [position]);

  const handleAddTag = () => {
    const trimmedTag = inputValue.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setInputValue("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSave = () => {
    onTagsAssign(tags);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg p-3 sm:p-4 w-[280px] max-w-[95vw]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <TagIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-popover-foreground" />
          <h3 className="text-xs sm:text-sm font-semibold text-popover-foreground">
            Tag Highlight
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Selected text preview */}
      <div className="mb-2 sm:mb-3">
        <p className="text-xs text-muted-foreground line-clamp-2 break-words font-serif italic">
          &quot;{selectedText}&quot;
        </p>
      </div>

      {/* Tag list */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3 min-h-[28px] sm:min-h-[32px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
          >
            <span className="break-all">{tag}</span>
            <button
              onClick={() => handleRemoveTag(tag)}
              className="hover:text-blue-900 shrink-0"
              aria-label={`Remove ${tag} tag`}
            >
              <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Tag input */}
      <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add tag..."
          className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground min-w-0"
        />
        <Button
          onClick={handleAddTag}
          size="sm"
          variant="outline"
          className="px-2 sm:px-3 shrink-0"
          aria-label="Add tag"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-1.5 sm:gap-2">
        <Button
          onClick={onClose}
          size="sm"
          variant="outline"
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          size="sm"
          className="w-full sm:w-auto order-1 sm:order-2"
        >
          Save Tags
        </Button>
      </div>
    </div>
  );
}
