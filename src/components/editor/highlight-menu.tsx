"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, Plus, Tag as TagIcon, Check, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTags } from "@/lib/actions"; // We'll use this to fetch tags
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface HighlightMenuProps {
  position: { x: number; y: number };
  selectedText: string;
  existingTags?: string[];
  onTagsAssign: (tags: string[]) => void;
  onClose: () => void;
  userId: string; // Required for fetching
}

export function HighlightMenu({
  position,
  selectedText,
  existingTags = [],
  onTagsAssign,
  onClose,
  userId,
}: HighlightMenuProps) {
  // State
  const [tags, setTags] = useState<string[]>(existingTags);
  const [inputValue, setInputValue] = useState("");
  const [availableTags, setAvailableTags] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0); // For keyboard nav

  // Refs
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Tags on Mount
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      const result = await getTags(userId);
      if (result.success && result.data) {
        setAvailableTags(result.data.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })));
      }
      setIsLoading(false);
    };
    fetchTags();
  }, [userId]);

  // 2. Click Outside & Esc
  useEffect(() => {
    inputRef.current?.focus();
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // 3. Smart Positioning
  useEffect(() => {
    if (!menuRef.current) return;
    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newLeft = position.x;
    let newTop = position.y;

    if (newLeft + rect.width > viewportWidth) {
      newLeft = viewportWidth - rect.width - 20;
    }
    if (newLeft < 0) newLeft = 20;

    // Flip to top if close to bottom
    if (newTop + rect.height > viewportHeight) {
      newTop = position.y - rect.height - 40; // Position above selection
    }

    menu.style.left = `${newLeft}px`;
    menu.style.top = `${newTop}px`;
  }, [position, availableTags]); // Re-calc when height changes due to list

  // 4. Filtering Logic
  const filteredSuggestions = useMemo(() => {
    const lowerInput = inputValue.toLowerCase().trim();
    // Filter out tags already added
    const unselected = availableTags.filter((t) => !tags.includes(t.name));
    
    if (!lowerInput) return unselected.slice(0, 5); // Show recent/top 5 empty

    return unselected.filter((t) => t.name.toLowerCase().includes(lowerInput));
  }, [availableTags, inputValue, tags]);

  // 5. Actions
  const addTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setInputValue("");
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    inputRef.current?.focus();
  };

  // 6. Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredSuggestions.length > 0 && selectedIndex >= 0) {
        // Select from dropdown
        addTag(filteredSuggestions[selectedIndex].name);
      } else if (inputValue.trim()) {
        // Create new
        addTag(inputValue);
      } else {
        // Save if empty input
        handleSave();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove last tag if input is empty
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSave = () => {
    if (tags.length > 0) {
      onTagsAssign(tags);
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      ref={menuRef}
      className="absolute z-[9999] bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl w-[320px] max-w-[95vw] flex flex-col overflow-hidden ring-1 ring-black/5"
      style={{ left: 0, top: 0 }} // Positioned by effect
    >
      {/* Header with Selection Preview */}
      <div className="p-3 border-b border-border/50 bg-secondary/10">
        <div className="flex items-center justify-between mb-2">
           <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TagIcon className="w-3 h-3" />
              Tag Selection
           </span>
           <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
           </button>
        </div>
        <p className="text-xs text-foreground/80 font-serif italic border-l-2 border-primary/20 pl-2 line-clamp-2">
            &quot;{selectedText}&quot;
        </p>
      </div>

      {/* Tag Input Area */}
      <div className="p-3 space-y-3">
         {/* Active Tags Chips */}
         {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
               {tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="animate-in zoom-in-50 duration-200 inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-md border border-primary/10"
                  >
                     {tag}
                     <button onClick={() => removeTag(tag)} className="hover:text-primary/70">
                        <X className="w-3 h-3" />
                     </button>
                  </span>
               ))}
            </div>
         )}

         {/* Input Field */}
         <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground/50" />
            <input
               ref={inputRef}
               value={inputValue}
               onChange={(e) => {
                  setInputValue(e.target.value);
                  setSelectedIndex(0); // Reset selection on type
               }}
               onKeyDown={handleKeyDown}
               placeholder={tags.length === 0 ? "Search or create tag..." : "Add another..."}
               className="w-full bg-secondary/30 border border-border/50 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
            />
         </div>
      </div>

      {/* Suggestions Dropdown */}
      <div className="max-h-[200px] overflow-y-auto border-t border-border/50 scrollbar-thin scrollbar-thumb-secondary">
         {isLoading ? (
            <div className="p-4 flex items-center justify-center text-xs text-muted-foreground gap-2">
               <Loader2 className="w-3 h-3 animate-spin" /> Loading tags...
            </div>
         ) : (
            <div className="p-1.5 space-y-0.5" ref={listRef}>
               {/* 1. Exact Match / Create Option */}
               {inputValue && !availableTags.some(t => t.name.toLowerCase() === inputValue.toLowerCase()) && !tags.includes(inputValue) && (
                  <button
                     onClick={() => addTag(inputValue)}
                     className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                        selectedIndex === -1 ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"
                     )}
                  >
                     <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <Plus className="w-3 h-3" />
                     </div>
                     <span className="truncate">Create <span className="font-semibold text-foreground">&quot;{inputValue}&quot;</span></span>
                  </button>
               )}

               {/* 2. Existing Suggestions */}
               {filteredSuggestions.map((tag, i) => (
                  <button
                     key={tag.id}
                     onClick={() => addTag(tag.name)}
                     onMouseEnter={() => setSelectedIndex(i)}
                     className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left group",
                        i === selectedIndex ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                     )}
                  >
                     <div className="flex items-center gap-2 truncate">
                        <HashIcon className={cn("w-3.5 h-3.5 shrink-0", i === selectedIndex ? "opacity-100" : "opacity-40")} />
                        <span className="truncate">{tag.name}</span>
                     </div>
                     {i === selectedIndex && <span className="text-[10px] opacity-70 font-mono">Enter</span>}
                  </button>
               ))}

               {filteredSuggestions.length === 0 && !inputValue && tags.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                     Type to search existing tags or create new ones.
                  </div>
               )}
            </div>
         )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-secondary/20 border-t border-border/50 flex justify-end gap-2">
         <Button size="sm" variant="ghost" onClick={onClose} className="h-8 text-xs">
            Cancel
         </Button>
         <Button size="sm" onClick={handleSave} disabled={tags.length === 0} className="h-8 text-xs bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
            <Check className="w-3 h-3 mr-1.5" />
            Save Highlight
         </Button>
      </div>
    </motion.div>
  );
}

// Simple Hash Icon component for the list
function HashIcon({ className }: { className?: string }) {
   return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <line x1="4" y1="9" x2="20" y2="9" />
         <line x1="4" y1="15" x2="20" y2="15" />
         <line x1="10" y1="3" x2="8" y2="21" />
         <line x1="16" y1="3" x2="14" y2="21" />
      </svg>
   )
}
