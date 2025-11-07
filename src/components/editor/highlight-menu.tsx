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
      className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 min-w-[300px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TagIcon className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Tag Highlight</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-3">
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          &quot;{selectedText}&quot;
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="hover:text-blue-900"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add tag..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button
          onClick={handleAddTag}
          size="sm"
          variant="outline"
          className="px-3"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={onClose} size="sm" variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSave} size="sm">
          Save Tags
        </Button>
      </div>
    </div>
  );
}
