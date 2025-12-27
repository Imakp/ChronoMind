import { TiptapContent } from "@/types";

/**
 * Extracts plain text from Tiptap JSON content and generates a preview
 * @param content - Tiptap JSON content
 * @param maxLength - Maximum length of preview (default: 200)
 * @returns Preview text with HTML stripped and length limited
 */
export function extractPreviewText(
  content: TiptapContent | null | undefined,
  maxLength: number = 200
): string {
  if (!content) {
    return "";
  }

  const text = extractTextFromTiptap(content);
  const trimmedText = text.trim();

  if (trimmedText.length <= maxLength) {
    return trimmedText;
  }

  // Find the last complete word within the limit
  const truncated = trimmedText.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(" ");

  if (lastSpaceIndex > maxLength * 0.8) {
    // If we can find a space in the last 20% of the text, use it
    return truncated.substring(0, lastSpaceIndex) + "...";
  }

  // Otherwise, just truncate at the limit
  return truncated + "...";
}

/**
 * Determines if Tiptap content contains substantial content
 * @param content - Tiptap JSON content
 * @returns true if content has substantial text, false for empty/whitespace-only content
 */
export function hasSubstantialContent(
  content: TiptapContent | null | undefined
): boolean {
  if (!content) {
    return false;
  }

  const text = extractTextFromTiptap(content);
  const trimmedText = text.trim();

  // Consider content substantial if it has more than just whitespace
  return trimmedText.length > 0;
}

/**
 * Recursively extracts plain text from Tiptap JSON structure
 * @param node - Tiptap content node
 * @returns Plain text string
 */
function extractTextFromTiptap(node: TiptapContent): string {
  let text = "";

  // If this node has direct text content
  if (node.text) {
    text += node.text;
  }

  // If this node has child content, recursively extract text
  if (node.content && Array.isArray(node.content)) {
    for (const child of node.content) {
      text += extractTextFromTiptap(child);

      // Add space between block elements for readability
      if (isBlockElement(child.type)) {
        text += " ";
      }
    }
  }

  return text;
}

/**
 * Determines if a Tiptap node type is a block element
 * @param nodeType - Tiptap node type
 * @returns true if it's a block element
 */
function isBlockElement(nodeType: string): boolean {
  const blockElements = [
    "paragraph",
    "heading",
    "blockquote",
    "codeBlock",
    "listItem",
    "bulletList",
    "orderedList",
    "horizontalRule",
    "hardBreak",
  ];

  return blockElements.includes(nodeType);
}

/**
 * Validates that content processing utilities are working correctly
 * Used for testing and migration validation
 */
export function validateContentProcessing(
  content: TiptapContent | null | undefined
): {
  hasContent: boolean;
  preview: string;
  textLength: number;
} {
  const hasContent = hasSubstantialContent(content);
  const preview = extractPreviewText(content);
  const textLength = content ? extractTextFromTiptap(content).trim().length : 0;

  return {
    hasContent,
    preview,
    textLength,
  };
}
