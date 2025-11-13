import { z } from "zod";

// Tiptap content validation
export const tiptapContentSchema = z.object({
  type: z.literal("doc"),
  content: z
    .array(
      z.object({
        type: z.string(),
        content: z.any().optional(),
        attrs: z.any().optional(),
      })
    )
    .optional(),
});

// Year validation
export const createYearSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  year: z
    .number()
    .int()
    .min(1900, "Year must be 1900 or later")
    .max(2100, "Year must be 2100 or earlier"),
});

// Daily log validation
export const updateDailyLogSchema = z.object({
  logId: z.string().min(1, "Log ID is required"),
  content: tiptapContentSchema,
});

// Quarterly reflection validation
export const updateQuarterlyReflectionSchema = z.object({
  yearId: z.string().min(1, "Year ID is required"),
  quarter: z.number().int().min(1).max(4, "Quarter must be between 1 and 4"),
  content: tiptapContentSchema,
});

// Goal validation
export const createGoalSchema = z.object({
  yearId: z.string().min(1, "Year ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
  description: tiptapContentSchema.optional(),
});

export const updateGoalSchema = z.object({
  goalId: z.string().min(1, "Goal ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
});

// Task validation
export const createTaskSchema = z.object({
  goalId: z.string().min(1, "Goal ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
  description: tiptapContentSchema.optional(),
});

export const updateTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
});

// SubTask validation
export const createSubTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
});

export const updateSubTaskSchema = z.object({
  subtaskId: z.string().min(1, "Subtask ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
});

// Book notes validation
export const createGenreSchema = z.object({
  yearId: z.string().min(1, "Year ID is required"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .trim(),
});

export const createBookSchema = z.object({
  genreId: z.string().min(1, "Genre ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
});

export const createChapterSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
  content: tiptapContentSchema.optional(),
});

export const updateChapterSchema = z.object({
  chapterId: z.string().min(1, "Chapter ID is required"),
  content: tiptapContentSchema,
});

// Lesson validation
export const createLessonSchema = z.object({
  yearId: z.string().min(1, "Year ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
  content: tiptapContentSchema.optional(),
});

export const updateLessonSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
  content: tiptapContentSchema,
});

// Creative note validation
export const createCreativeNoteSchema = z.object({
  yearId: z.string().min(1, "Year ID is required"),
  content: tiptapContentSchema.optional(),
});

export const updateCreativeNoteSchema = z.object({
  noteId: z.string().min(1, "Note ID is required"),
  content: tiptapContentSchema,
});

// Highlight validation
export const createHighlightSchema = z.object({
  entityType: z.enum([
    "dailyLog",
    "quarterlyReflection",
    "goal",
    "task",
    "subtask",
    "chapter",
    "lesson",
    "creativeNote",
  ]),
  entityId: z.string().min(1, "Entity ID is required"),
  tiptapId: z.string().min(1, "Tiptap ID is required"),
  text: z
    .string()
    .min(1, "Text is required")
    .max(5000, "Text must be 5000 characters or less"),
  startOffset: z.number().int().min(0, "Start offset must be non-negative"),
  endOffset: z.number().int().min(0, "End offset must be non-negative"),
  tagIds: z.array(z.string()).optional(),
});

// Tag validation
export const createTagSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or less")
    .trim()
    .regex(
      /^[a-zA-Z0-9-_\s]+$/,
      "Tag name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
});

export const getOrCreateTagsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  tagNames: z
    .array(
      z
        .string()
        .min(1, "Tag name is required")
        .max(50, "Tag name must be 50 characters or less")
        .trim()
    )
    .min(1, "At least one tag name is required"),
});

// Helper function to sanitize HTML content
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}

// Helper function to validate and sanitize Tiptap content
export function sanitizeTiptapContent(content: any): any {
  if (!content || typeof content !== "object") {
    return { type: "doc", content: [] };
  }

  const sanitizeNode = (node: any): any => {
    if (!node || typeof node !== "object") return node;

    const sanitized = { ...node };

    if (node.content && Array.isArray(node.content)) {
      sanitized.content = node.content.map(sanitizeNode);
    }

    if (node.text && typeof node.text === "string") {
      sanitized.text = node.text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "");
    }

    return sanitized;
  };

  return sanitizeNode(content);
}
