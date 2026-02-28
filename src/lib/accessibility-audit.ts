/**
 * Accessibility audit utilities for WCAG compliance and performance optimization
 */

// WCAG contrast ratio requirements
const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;
const WCAG_AAA_NORMAL = 7.0;
const WCAG_AAA_LARGE = 4.5;

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 1 / 6) {
    r = c;
    g = x;
    b = 0;
  } else if (1 / 6 <= h && h < 2 / 6) {
    r = x;
    g = c;
    b = 0;
  } else if (2 / 6 <= h && h < 3 / 6) {
    r = 0;
    g = c;
    b = x;
  } else if (3 / 6 <= h && h < 4 / 6) {
    r = 0;
    g = x;
    b = c;
  } else if (4 / 6 <= h && h < 5 / 6) {
    r = x;
    g = 0;
    b = c;
  } else if (5 / 6 <= h && h < 1) {
    r = c;
    g = 0;
    b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(
  color1: [number, number, number],
  color2: [number, number, number]
): number {
  const lum1 = getLuminance(...color1);
  const lum2 = getLuminance(...color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Parse HSL string to numbers
 */
function parseHsl(hslString: string): [number, number, number] {
  const match = hslString.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
  if (!match) {
    throw new Error(`Invalid HSL string: ${hslString}`);
  }
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

/**
 * Check if contrast ratio meets WCAG requirements
 */
export function checkContrastRatio(
  foregroundHsl: string,
  backgroundHsl: string,
  isLargeText = false,
  level: "AA" | "AAA" = "AA"
): {
  ratio: number;
  passes: boolean;
  required: number;
  grade: "AAA" | "AA" | "Fail";
} {
  const [fh, fs, fl] = parseHsl(foregroundHsl);
  const [bh, bs, bl] = parseHsl(backgroundHsl);

  const foregroundRgb = hslToRgb(fh, fs, fl);
  const backgroundRgb = hslToRgb(bh, bs, bl);

  const ratio = getContrastRatio(foregroundRgb, backgroundRgb);

  const requiredAA = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
  const requiredAAA = isLargeText ? WCAG_AAA_LARGE : WCAG_AAA_NORMAL;

  let grade: "AAA" | "AA" | "Fail" = "Fail";
  if (ratio >= requiredAAA) {
    grade = "AAA";
  } else if (ratio >= requiredAA) {
    grade = "AA";
  }

  const required = level === "AAA" ? requiredAAA : requiredAA;

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: ratio >= required,
    required,
    grade,
  };
}

/**
 * Modern Atelier color palette for validation
 */
export const MODERN_ATELIER_COLORS = {
  canvas: "hsl(38 30% 98%)", // Background
  ink: "hsl(215 25% 20%)", // Primary text
  surface: "hsl(40 25% 97%)", // Cards
  primary: "hsl(210 20% 25%)", // Buttons/CTAs
  accent: "hsl(35 60% 85%)", // Highlights
  destructive: "hsl(0 65% 50%)", // Error states
  border: "hsl(40 10% 88%)", // Borders
  muted: "hsl(215 25% 45%)", // Secondary text
} as const;

/**
 * Validate all color combinations in the Modern Atelier palette
 */
export function validateColorPalette(): Array<{
  combination: string;
  result: ReturnType<typeof checkContrastRatio>;
  isValid: boolean;
}> {
  const results = [];

  // Primary text combinations
  const textCombinations = [
    {
      name: "Primary text on Canvas",
      fg: MODERN_ATELIER_COLORS.ink,
      bg: MODERN_ATELIER_COLORS.canvas,
    },
    {
      name: "Primary text on Surface",
      fg: MODERN_ATELIER_COLORS.ink,
      bg: MODERN_ATELIER_COLORS.surface,
    },
    {
      name: "Primary text on Accent",
      fg: MODERN_ATELIER_COLORS.ink,
      bg: MODERN_ATELIER_COLORS.accent,
    },
    {
      name: "Canvas text on Primary",
      fg: MODERN_ATELIER_COLORS.canvas,
      bg: MODERN_ATELIER_COLORS.primary,
    },
    {
      name: "Canvas text on Destructive",
      fg: MODERN_ATELIER_COLORS.canvas,
      bg: MODERN_ATELIER_COLORS.destructive,
    },
    {
      name: "Muted text on Canvas",
      fg: MODERN_ATELIER_COLORS.muted,
      bg: MODERN_ATELIER_COLORS.canvas,
    },
    {
      name: "Muted text on Surface",
      fg: MODERN_ATELIER_COLORS.muted,
      bg: MODERN_ATELIER_COLORS.surface,
    },
  ];

  for (const combo of textCombinations) {
    const result = checkContrastRatio(combo.fg, combo.bg);
    results.push({
      combination: combo.name,
      result,
      isValid: result.passes,
    });
  }

  return results;
}

/**
 * Performance optimization for CSS custom properties
 */
export function optimizeCssCustomProperties(): string {
  return `
/* Optimized CSS Custom Properties - Modern Atelier */
:root {
  /* Core color values - computed once */
  --hsl-canvas: 38 30% 98%;
  --hsl-ink: 215 25% 20%;
  --hsl-surface: 40 25% 97%;
  --hsl-primary: 210 20% 25%;
  --hsl-accent: 35 60% 85%;
  --hsl-destructive: 0 65% 50%;
  --hsl-border: 40 10% 88%;
  --hsl-muted: 215 25% 45%;
  
  /* Semantic color mappings */
  --background: var(--hsl-canvas);
  --foreground: var(--hsl-ink);
  --card: var(--hsl-surface);
  --card-foreground: var(--hsl-ink);
  --popover: var(--hsl-surface);
  --popover-foreground: var(--hsl-ink);
  --primary: var(--hsl-primary);
  --primary-foreground: var(--hsl-canvas);
  --secondary: var(--hsl-surface);
  --secondary-foreground: var(--hsl-ink);
  --muted: var(--hsl-surface);
  --muted-foreground: var(--hsl-muted);
  --accent: var(--hsl-accent);
  --accent-foreground: var(--hsl-ink);
  --destructive: var(--hsl-destructive);
  --destructive-foreground: var(--hsl-canvas);
  --border: var(--hsl-border);
  --input: var(--hsl-border);
  --ring: var(--hsl-accent);
  
  /* Optimized spacing system */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  
  /* Performance-optimized transitions */
  --transition-fast: 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --transition-normal: 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --transition-slow: 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
`;
}

/**
 * Keyboard navigation test utilities
 */
export function testKeyboardNavigation(container: HTMLElement): Array<{
  element: HTMLElement;
  issues: string[];
}> {
  const issues: Array<{ element: HTMLElement; issues: string[] }> = [];

  // Find all interactive elements
  const interactiveElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"], [role="menuitem"]'
  );

  interactiveElements.forEach((element) => {
    const elementIssues: string[] = [];

    // Check if element is focusable
    const tabIndex = element.getAttribute("tabindex");
    if (
      tabIndex === "-1" &&
      !element.matches("button, [href], input, select, textarea")
    ) {
      elementIssues.push("Element is not focusable but appears interactive");
    }

    // Check for accessible name
    const accessibleName =
      element.getAttribute("aria-label") ||
      element.getAttribute("aria-labelledby") ||
      element.textContent?.trim() ||
      element.getAttribute("title");

    if (!accessibleName) {
      elementIssues.push("Element lacks accessible name");
    }

    // Check for proper role
    const role = element.getAttribute("role");
    const tagName = element.tagName.toLowerCase();

    if (tagName === "div" && element.onclick && !role) {
      elementIssues.push("Clickable div should have proper role");
    }

    // Check for keyboard event handlers
    const hasKeyboardHandler =
      element.onkeydown || element.onkeyup || element.onkeypress;
    if (
      element.onclick &&
      !hasKeyboardHandler &&
      tagName !== "button" &&
      tagName !== "a"
    ) {
      elementIssues.push("Interactive element should handle keyboard events");
    }

    if (elementIssues.length > 0) {
      issues.push({ element, issues: elementIssues });
    }
  });

  return issues;
}

/**
 * Screen reader compatibility test
 */
export function testScreenReaderCompatibility(container: HTMLElement): Array<{
  element: HTMLElement;
  issues: string[];
}> {
  const issues: Array<{ element: HTMLElement; issues: string[] }> = [];

  // Check for proper heading hierarchy
  const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
  let lastLevel = 0;

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.charAt(1));
    const elementIssues: string[] = [];

    if (level > lastLevel + 1) {
      elementIssues.push(`Heading level skips from h${lastLevel} to h${level}`);
    }

    if (!heading.textContent?.trim()) {
      elementIssues.push("Heading is empty");
    }

    if (elementIssues.length > 0) {
      issues.push({ element: heading as HTMLElement, issues: elementIssues });
    }

    lastLevel = level;
  });

  // Check for images without alt text
  const images = container.querySelectorAll("img");
  images.forEach((img) => {
    const elementIssues: string[] = [];

    if (!img.hasAttribute("alt")) {
      elementIssues.push("Image missing alt attribute");
    }

    if (elementIssues.length > 0) {
      issues.push({ element: img, issues: elementIssues });
    }
  });

  // Check for form labels
  const inputs = container.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    const elementIssues: string[] = [];

    const id = input.getAttribute("id");
    const ariaLabel = input.getAttribute("aria-label");
    const ariaLabelledBy = input.getAttribute("aria-labelledby");

    if (id) {
      const label = container.querySelector(`label[for="${id}"]`);
      if (!label && !ariaLabel && !ariaLabelledBy) {
        elementIssues.push("Form input lacks proper label");
      }
    } else if (!ariaLabel && !ariaLabelledBy) {
      elementIssues.push("Form input lacks proper label");
    }

    if (elementIssues.length > 0) {
      issues.push({ element: input as HTMLElement, issues: elementIssues });
    }
  });

  return issues;
}

/**
 * Generate accessibility audit report
 */
export function generateAccessibilityReport(
  container: HTMLElement = document.body
): {
  colorContrast: ReturnType<typeof validateColorPalette>;
  keyboardNavigation: ReturnType<typeof testKeyboardNavigation>;
  screenReader: ReturnType<typeof testScreenReaderCompatibility>;
  summary: {
    totalIssues: number;
    criticalIssues: number;
    passed: boolean;
  };
} {
  const colorContrast = validateColorPalette();
  const keyboardNavigation = testKeyboardNavigation(container);
  const screenReader = testScreenReaderCompatibility(container);

  const totalIssues =
    keyboardNavigation.length +
    screenReader.length +
    colorContrast.filter((c) => !c.isValid).length;

  const criticalIssues =
    colorContrast.filter((c) => !c.isValid).length +
    keyboardNavigation.filter((k) =>
      k.issues.some(
        (i) => i.includes("not focusable") || i.includes("accessible name")
      )
    ).length;

  return {
    colorContrast,
    keyboardNavigation,
    screenReader,
    summary: {
      totalIssues,
      criticalIssues,
      passed: totalIssues === 0,
    },
  };
}
