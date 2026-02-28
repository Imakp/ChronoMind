import { useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

interface KeyboardShortcutsConfig {
  year: number;
  onCommandPalette: () => void;
  onNewEntry?: () => void;
  onTagging?: () => void;
  onShowShortcuts?: () => void;
  currentSection?: string;
}

export function useKeyboardShortcuts({
  year,
  onCommandPalette,
  onNewEntry,
  onTagging,
  onShowShortcuts,
  currentSection,
}: KeyboardShortcutsConfig) {
  const router = useRouter();

  // Navigation items for section shortcuts (1-7)
  const navigation = useMemo(
    () => [
      { href: `/year/${year}/daily-logs`, section: "daily-logs" },
      {
        href: `/year/${year}/quarterly-reflections`,
        section: "quarterly-reflections",
      },
      { href: `/year/${year}/yearly-goals`, section: "yearly-goals" },
      { href: `/year/${year}/book-notes`, section: "book-notes" },
      { href: `/year/${year}/lessons-learned`, section: "lessons-learned" },
      { href: `/year/${year}/creative-dump`, section: "creative-dump" },
      { href: `/year/${year}/tags`, section: "tags" },
    ],
    [year]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const activeElement = document.activeElement;
      const isTyping =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          (activeElement as HTMLElement).contentEditable === "true");

      // Command Palette (Cmd+K / Ctrl+K)
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        onCommandPalette();
        return;
      }

      // New Entry (Cmd+N / Ctrl+N)
      if ((event.metaKey || event.ctrlKey) && event.key === "n" && onNewEntry) {
        event.preventDefault();
        onNewEntry();
        return;
      }

      // Quick Tagging (Cmd+T / Ctrl+T) - only when text is selected
      if ((event.metaKey || event.ctrlKey) && event.key === "t" && onTagging) {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
          event.preventDefault();
          onTagging();
          return;
        }
      }

      // Show keyboard shortcuts overlay with '?' key
      if (
        event.key === "?" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isTyping &&
        onShowShortcuts
      ) {
        event.preventDefault();
        onShowShortcuts();
        return;
      }

      // Navigation shortcuts (1-7) - only when not typing
      if (
        event.key >= "1" &&
        event.key <= "7" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isTyping
      ) {
        event.preventDefault();
        const shortcutIndex = parseInt(event.key) - 1;
        if (navigation[shortcutIndex]) {
          router.push(navigation[shortcutIndex].href);
        }
        return;
      }

      // Section-specific shortcuts
      if (!isTyping) {
        // Goals section shortcuts
        if (currentSection === "yearly-goals") {
          if (
            event.key === "g" &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            event.preventDefault();
            onNewEntry?.();
            return;
          }
        }

        // Books section shortcuts
        if (currentSection === "book-notes") {
          if (
            event.key === "b" &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            event.preventDefault();
            onNewEntry?.();
            return;
          }
        }

        // Daily logs shortcuts
        if (currentSection === "daily-logs") {
          if (
            event.key === "d" &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            event.preventDefault();
            onNewEntry?.();
            return;
          }
        }
      }
    },
    [
      router,
      navigation,
      onCommandPalette,
      onNewEntry,
      onTagging,
      onShowShortcuts,
      currentSection,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Return shortcut information for display
  return {
    shortcuts: [
      {
        category: "Navigation",
        items: [
          { key: "Cmd+K", description: "Open command palette" },
          { key: "1-7", description: "Navigate to sections" },
          { key: "?", description: "Show keyboard shortcuts" },
        ],
      },
      {
        category: "Actions",
        items: [
          { key: "Cmd+N", description: "Create new entry" },
          { key: "Cmd+T", description: "Tag selected text" },
          ...(currentSection === "yearly-goals"
            ? [{ key: "G", description: "New goal" }]
            : []),
          ...(currentSection === "book-notes"
            ? [{ key: "B", description: "New book/genre" }]
            : []),
          ...(currentSection === "daily-logs"
            ? [{ key: "D", description: "New daily entry" }]
            : []),
        ],
      },
      {
        category: "Sections",
        items: [
          { key: "1", description: "Daily Logs" },
          { key: "2", description: "Quarterly Reflections" },
          { key: "3", description: "Yearly Goals" },
          { key: "4", description: "Book Notes" },
          { key: "5", description: "Lessons Learned" },
          { key: "6", description: "Creative Dump" },
          { key: "7", description: "Tag Explorer" },
        ],
      },
    ],
  };
}
