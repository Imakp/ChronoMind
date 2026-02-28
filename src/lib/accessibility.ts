/**
 * Accessibility utilities for improved keyboard navigation and screen reader support
 */

/**
 * Enhanced focusable element selector including ARIA roles
 */
const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]:not([disabled])',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[contenteditable="true"]',
].join(", ");

/**
 * Trap focus within a container element with enhanced keyboard support
 */
export function trapFocus(element: HTMLElement) {
  const focusableElements =
    element.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    // Handle Tab navigation
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }

    // Handle Escape key to exit focus trap
    if (e.key === "Escape") {
      const event = new CustomEvent("focustrap:escape", { bubbles: true });
      element.dispatchEvent(event);
    }

    // Handle Arrow keys for menu-like navigation
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const currentIndex = Array.from(focusableElements).indexOf(
        document.activeElement as HTMLElement
      );
      if (currentIndex !== -1) {
        e.preventDefault();
        let nextIndex;
        if (e.key === "ArrowDown") {
          nextIndex = (currentIndex + 1) % focusableElements.length;
        } else {
          nextIndex =
            (currentIndex - 1 + focusableElements.length) %
            focusableElements.length;
        }
        focusableElements[nextIndex].focus();
      }
    }
  };

  element.addEventListener("keydown", handleKeyDown);

  // Focus first element when trap is activated
  if (firstElement) {
    firstElement.focus();
  }

  return () => {
    element.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Enhanced roving tabindex for component navigation
 */
export function setupRovingTabindex(
  container: HTMLElement,
  selector: string = '[role="tab"], [role="menuitem"]'
) {
  const items = container.querySelectorAll<HTMLElement>(selector);

  if (items.length === 0) return () => {};

  // Set initial tabindex values
  items.forEach((item, index) => {
    item.setAttribute("tabindex", index === 0 ? "0" : "-1");
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (!target.matches(selector)) return;

    const currentIndex = Array.from(items).indexOf(target);
    let nextIndex = currentIndex;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        nextIndex = (currentIndex - 1 + items.length) % items.length;
        break;
      case "Home":
        e.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        e.preventDefault();
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    // Update tabindex and focus
    items[currentIndex].setAttribute("tabindex", "-1");
    items[nextIndex].setAttribute("tabindex", "0");
    items[nextIndex].focus();
  };

  container.addEventListener("keydown", handleKeyDown);

  return () => {
    container.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Announce message to screen readers with enhanced options
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite",
  delay: number = 100
) {
  // Clear any existing announcements first
  const existingAnnouncements = document.querySelectorAll(
    '[data-announcement="true"]'
  );
  existingAnnouncements.forEach((el) => el.remove());

  setTimeout(() => {
    const announcement = document.createElement("div");
    announcement.setAttribute(
      "role",
      priority === "assertive" ? "alert" : "status"
    );
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.setAttribute("data-announcement", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Clean up after announcement
    setTimeout(() => {
      if (announcement.parentNode) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, delay);
}

/**
 * Enhanced skip link functionality
 */
export function createSkipLink(
  targetId: string,
  text: string = "Skip to main content"
): HTMLElement {
  const skipLink = document.createElement("a");
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className =
    "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg";

  skipLink.addEventListener("click", (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  return skipLink;
}

/**
 * Manage focus restoration after modal/dialog interactions
 */
export class FocusManager {
  private previousFocus: HTMLElement | null = null;

  saveFocus() {
    this.previousFocus = document.activeElement as HTMLElement;
  }

  restoreFocus() {
    if (this.previousFocus && typeof this.previousFocus.focus === "function") {
      this.previousFocus.focus();
    }
    this.previousFocus = null;
  }

  moveFocusToElement(element: HTMLElement) {
    if (element && typeof element.focus === "function") {
      element.focus();
    }
  }
}

/**
 * Enhanced keyboard event handler for custom components
 */
export function handleKeyboardActivation(
  event: KeyboardEvent,
  callback: () => void,
  keys: string[] = ["Enter", " "]
) {
  if (keys.includes(event.key)) {
    event.preventDefault();
    callback();
  }
}

/**
 * Get readable label for section type
 */
export function getSectionLabel(sectionId: string): string {
  const labels: Record<string, string> = {
    "daily-logs": "Daily Logs",
    "quarterly-reflections": "Quarterly Reflections",
    "yearly-goals": "Yearly Goals",
    "book-notes": "Book Notes",
    "lessons-learned": "Lessons Learned",
    "creative-dump": "Creative Dump",
  };
  return labels[sectionId] || sectionId;
}

/**
 * Format date for screen readers
 */
export function formatDateForScreenReader(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
