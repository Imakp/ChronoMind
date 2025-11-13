"use server";

import { db } from "./db";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import {
  createYearSchema,
  updateDailyLogSchema,
  updateQuarterlyReflectionSchema,
  createGoalSchema,
  updateGoalSchema,
  createTaskSchema,
  updateTaskSchema,
  createSubTaskSchema,
  updateSubTaskSchema,
  createGenreSchema,
  createBookSchema,
  createChapterSchema,
  updateChapterSchema,
  createLessonSchema,
  updateLessonSchema,
  createCreativeNoteSchema,
  updateCreativeNoteSchema,
  createHighlightSchema,
  createTagSchema,
  getOrCreateTagsSchema,
  sanitizeTiptapContent,
} from "./validations";
import { handleActionError } from "./error-handler";

// Types for Tiptap content
export type TiptapContent = {
  type: "doc";
  content?: Array<{
    type: string;
    content?: Array<{
      type: string;
      text?: string;
      marks?: Array<{ type: string; attrs?: any }>;
    }>;
    attrs?: any;
  }>;
};

// Year Management Actions
export async function createYear(userId: string, year: number) {
  try {
    // Validate input
    const validated = createYearSchema.parse({ userId, year });

    const newYear = await db.year.create({
      data: {
        year: validated.year,
        userId: validated.userId,
      },
    });

    revalidatePath("/");
    return { success: true, data: newYear };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getUserYears(userId: string) {
  try {
    const years = await db.year.findMany({
      where: { userId },
      orderBy: { year: "desc" },
    });

    return { success: true, data: years };
  } catch (error) {
    console.error("Error fetching user years:", error);
    return { success: false, error: "Failed to fetch years" };
  }
}

export async function getYearById(yearId: string, userId: string) {
  try {
    const year = await db.year.findFirst({
      where: {
        id: yearId,
        userId,
      },
    });

    if (!year) {
      return { success: false, error: "Year not found" };
    }

    return { success: true, data: year };
  } catch (error) {
    console.error("Error fetching year:", error);
    return { success: false, error: "Failed to fetch year" };
  }
}

export async function getYearByNumber(yearNumber: number, userId: string) {
  try {
    const year = await db.year.findFirst({
      where: {
        year: yearNumber,
        userId,
      },
    });

    if (!year) {
      return { success: false, error: "Year not found" };
    }

    return { success: true, data: year };
  } catch (error) {
    console.error("Error fetching year:", error);
    return { success: false, error: "Failed to fetch year" };
  }
}

// Daily Log Actions
export async function getOrCreateDailyLog(yearId: string, date: Date) {
  try {
    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    let dailyLog = await db.dailyLog.findUnique({
      where: {
        yearId_date: {
          yearId,
          date: normalizedDate,
        },
      },
      include: {
        highlights: {
          include: {
            tags: true,
          },
        },
      },
    });

    if (!dailyLog) {
      dailyLog = await db.dailyLog.create({
        data: {
          yearId,
          date: normalizedDate,
          content: {
            type: "doc",
            content: [],
          },
        },
        include: {
          highlights: {
            include: {
              tags: true,
            },
          },
        },
      });
    }

    return { success: true, data: dailyLog };
  } catch (error) {
    console.error("Error getting or creating daily log:", error);
    return { success: false, error: "Failed to get or create daily log" };
  }
}

export async function updateDailyLog(logId: string, content: TiptapContent) {
  try {
    // Validate and sanitize using the schema
    const validated = updateDailyLogSchema.parse({ logId, content });
    const sanitizedContent = sanitizeTiptapContent(validated.content);

    const updatedLog = await db.dailyLog.update({
      where: { id: validated.logId },
      data: { content: sanitizedContent as Prisma.InputJsonValue },
    });

    revalidatePath("/");
    return { success: true, data: updatedLog };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getDailyLogs(yearId: string) {
  try {
    const logs = await db.dailyLog.findMany({
      where: { yearId },
      orderBy: { date: "desc" },
      include: {
        highlights: {
          include: {
            tags: true,
          },
        },
      },
    });

    return { success: true, data: logs };
  } catch (error) {
    console.error("Error fetching daily logs:", error);
    return { success: false, error: "Failed to fetch daily logs" };
  }
}

// Quarterly Reflection Actions
export async function updateQuarterlyReflection(
  yearId: string,
  quarter: number,
  content: TiptapContent
) {
  try {
    // Validate and sanitize using the schema
    const validated = updateQuarterlyReflectionSchema.parse({
      yearId,
      quarter,
      content,
    });
    const sanitizedContent = sanitizeTiptapContent(validated.content);

    const reflection = await db.quarterlyReflection.upsert({
      where: {
        yearId_quarter: {
          yearId: validated.yearId,
          quarter: validated.quarter,
        },
      },
      update: {
        content: sanitizedContent as Prisma.InputJsonValue,
      },
      create: {
        yearId: validated.yearId,
        quarter: validated.quarter,
        content: sanitizedContent as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/");
    return { success: true, data: reflection };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getQuarterlyReflections(yearId: string) {
  try {
    const reflections = await db.quarterlyReflection.findMany({
      where: { yearId },
      orderBy: { quarter: "asc" },
      include: {
        highlights: {
          include: {
            tags: true,
          },
        },
      },
    });

    return { success: true, data: reflections };
  } catch (error) {
    console.error("Error fetching quarterly reflections:", error);
    return { success: false, error: "Failed to fetch quarterly reflections" };
  }
}

// Goal Management Actions
export async function createGoal(
  yearId: string,
  title: string,
  description?: TiptapContent
) {
  try {
    // Validate and sanitize input
    const validated = createGoalSchema.parse({ yearId, title, description });
    const sanitizedDescription = validated.description
      ? sanitizeTiptapContent(validated.description)
      : undefined;

    const goal = await db.goal.create({
      data: {
        title: validated.title,
        description: sanitizedDescription as Prisma.InputJsonValue,
        yearId: validated.yearId,
      },
      include: {
        tasks: {
          include: {
            subtasks: true,
          },
        },
      },
    });

    revalidatePath("/");
    return { success: true, data: goal };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createTask(
  goalId: string,
  title: string,
  description?: TiptapContent
) {
  try {
    // Validate and sanitize input
    const validated = createTaskSchema.parse({ goalId, title, description });
    const sanitizedDescription = validated.description
      ? sanitizeTiptapContent(validated.description)
      : undefined;

    const task = await db.task.create({
      data: {
        title: validated.title,
        description: sanitizedDescription as Prisma.InputJsonValue,
        goalId: validated.goalId,
      },
      include: {
        subtasks: true,
      },
    });

    // Recalculate goal percentage
    await recalculateGoalPercentage(goalId);

    revalidatePath("/");
    return { success: true, data: task };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createSubTask(taskId: string, title: string) {
  try {
    // Validate input
    const validated = createSubTaskSchema.parse({ taskId, title });

    const subtask = await db.subTask.create({
      data: {
        title: validated.title,
        taskId: validated.taskId,
      },
    });

    // Get the task to find the goal
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: { goalId: true },
    });

    if (task) {
      await recalculateTaskPercentage(taskId);
      await recalculateGoalPercentage(task.goalId);
    }

    revalidatePath("/");
    return { success: true, data: subtask };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function toggleSubTask(subtaskId: string) {
  try {
    const subtask = await db.subTask.findUnique({
      where: { id: subtaskId },
      include: {
        task: {
          select: { id: true, goalId: true },
        },
      },
    });

    if (!subtask) {
      return { success: false, error: "Subtask not found" };
    }

    const updatedSubtask = await db.subTask.update({
      where: { id: subtaskId },
      data: { isComplete: !subtask.isComplete },
    });

    // Recalculate percentages
    await recalculateTaskPercentage(subtask.task.id);
    await recalculateGoalPercentage(subtask.task.goalId);

    revalidatePath("/");
    return { success: true, data: updatedSubtask };
  } catch (error) {
    console.error("Error toggling subtask:", error);
    return { success: false, error: "Failed to toggle subtask" };
  }
}

async function recalculateTaskPercentage(taskId: string) {
  const subtasks = await db.subTask.findMany({
    where: { taskId },
  });

  if (subtasks.length === 0) {
    await db.task.update({
      where: { id: taskId },
      data: { percentage: 0 },
    });
    return;
  }

  const completedCount = subtasks.filter((st) => st.isComplete).length;
  const percentage = (completedCount / subtasks.length) * 100;

  await db.task.update({
    where: { id: taskId },
    data: { percentage },
  });
}

async function recalculateGoalPercentage(goalId: string) {
  const tasks = await db.task.findMany({
    where: { goalId },
  });

  if (tasks.length === 0) {
    await db.goal.update({
      where: { id: goalId },
      data: { percentage: 0 },
    });
    return;
  }

  const totalPercentage = tasks.reduce((sum, task) => sum + task.percentage, 0);
  const averagePercentage = totalPercentage / tasks.length;

  await db.goal.update({
    where: { id: goalId },
    data: { percentage: averagePercentage },
  });
}

export async function updateGoal(goalId: string, title: string) {
  try {
    // Validate input
    const validated = updateGoalSchema.parse({ goalId, title });

    const goal = await db.goal.update({
      where: { id: validated.goalId },
      data: { title: validated.title },
    });

    revalidatePath("/");
    return { success: true, data: goal };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateTask(taskId: string, title: string) {
  try {
    // Validate input
    const validated = updateTaskSchema.parse({ taskId, title });

    const task = await db.task.update({
      where: { id: validated.taskId },
      data: { title: validated.title },
    });

    revalidatePath("/");
    return { success: true, data: task };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateSubTask(subtaskId: string, title: string) {
  try {
    // Validate input
    const validated = updateSubTaskSchema.parse({ subtaskId, title });

    const subtask = await db.subTask.update({
      where: { id: validated.subtaskId },
      data: { title: validated.title },
    });

    revalidatePath("/");
    return { success: true, data: subtask };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteGoal(goalId: string) {
  try {
    if (!goalId) {
      return { success: false, error: "Goal ID is required" };
    }

    await db.goal.delete({
      where: { id: goalId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteTask(taskId: string) {
  try {
    if (!taskId) {
      return { success: false, error: "Task ID is required" };
    }

    await db.task.delete({
      where: { id: taskId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteSubTask(subtaskId: string) {
  try {
    if (!subtaskId) {
      return { success: false, error: "Subtask ID is required" };
    }

    const subtask = await db.subTask.findUnique({
      where: { id: subtaskId },
      include: {
        task: {
          select: { id: true, goalId: true },
        },
      },
    });

    if (!subtask) {
      return { success: false, error: "Subtask not found" };
    }

    await db.subTask.delete({
      where: { id: subtaskId },
    });

    // Recalculate percentages
    await recalculateTaskPercentage(subtask.task.id);
    await recalculateGoalPercentage(subtask.task.goalId);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getGoals(yearId: string) {
  try {
    const goals = await db.goal.findMany({
      where: { yearId },
      include: {
        tasks: {
          include: {
            subtasks: {
              include: {
                highlights: {
                  include: {
                    tags: true,
                  },
                },
              },
            },
            highlights: {
              include: {
                tags: true,
              },
            },
          },
        },
        highlights: {
          include: {
            tags: true,
          },
        },
      },
    });

    return { success: true, data: goals };
  } catch (error) {
    return handleActionError(error);
  }
}

// Book Notes Actions
export async function createGenre(yearId: string, name: string) {
  try {
    const genre = await db.genre.create({
      data: {
        name,
        yearId,
      },
      include: {
        books: {
          include: {
            chapters: true,
          },
        },
      },
    });

    revalidatePath("/");
    return { success: true, data: genre };
  } catch (error) {
    console.error("Error creating genre:", error);
    return { success: false, error: "Failed to create genre" };
  }
}

export async function createBook(genreId: string, title: string) {
  try {
    const book = await db.book.create({
      data: {
        title,
        genreId,
      },
      include: {
        chapters: true,
      },
    });

    revalidatePath("/");
    return { success: true, data: book };
  } catch (error) {
    console.error("Error creating book:", error);
    return { success: false, error: "Failed to create book" };
  }
}

export async function createChapter(
  bookId: string,
  title: string,
  content?: TiptapContent
) {
  try {
    // Validate and sanitize input
    const validated = createChapterSchema.parse({ bookId, title, content });
    const sanitizedContent = validated.content
      ? sanitizeTiptapContent(validated.content)
      : undefined;

    const chapter = await db.chapter.create({
      data: {
        title: validated.title,
        content: sanitizedContent as Prisma.InputJsonValue,
        bookId: validated.bookId,
      },
      include: {
        highlights: {
          include: {
            tags: true,
          },
        },
      },
    });

    revalidatePath("/");
    return { success: true, data: chapter };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateChapter(chapterId: string, content: TiptapContent) {
  try {
    // Validate and sanitize using the schema
    const validated = updateChapterSchema.parse({ chapterId, content });
    const sanitizedContent = sanitizeTiptapContent(validated.content);

    const chapter = await db.chapter.update({
      where: { id: validated.chapterId },
      data: { content: sanitizedContent as Prisma.InputJsonValue },
    });

    revalidatePath("/");
    return { success: true, data: chapter };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getBookNotes(yearId: string) {
  try {
    const genres = await db.genre.findMany({
      where: { yearId },
      include: {
        books: {
          include: {
            chapters: {
              include: {
                highlights: {
                  include: {
                    tags: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return { success: true, data: genres };
  } catch (error) {
    console.error("Error fetching book notes:", error);
    return { success: false, error: "Failed to fetch book notes" };
  }
}

export async function deleteGenre(genreId: string) {
  try {
    await db.genre.delete({
      where: { id: genreId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting genre:", error);
    return { success: false, error: "Failed to delete genre" };
  }
}

export async function deleteBook(bookId: string) {
  try {
    await db.book.delete({
      where: { id: bookId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting book:", error);
    return { success: false, error: "Failed to delete book" };
  }
}

export async function deleteChapter(chapterId: string) {
  try {
    await db.chapter.delete({
      where: { id: chapterId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return { success: false, error: "Failed to delete chapter" };
  }
}

// Lessons Learned Actions
export async function createLesson(
  yearId: string,
  title: string,
  content?: TiptapContent
) {
  try {
    // Validate and sanitize input
    const validated = createLessonSchema.parse({ yearId, title, content });
    const sanitizedContent = validated.content
      ? sanitizeTiptapContent(validated.content)
      : undefined;

    const lesson = await db.lesson.create({
      data: {
        title: validated.title,
        content: sanitizedContent as Prisma.InputJsonValue,
        yearId: validated.yearId,
      },
      include: {
        highlights: {
          include: {
            tags: true,
          },
        },
      },
    });

    revalidatePath("/");
    return { success: true, data: lesson };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateLesson(
  lessonId: string,
  title: string,
  content: TiptapContent
) {
  try {
    // Validate and sanitize input
    const validated = updateLessonSchema.parse({ lessonId, title, content });
    const sanitizedContent = sanitizeTiptapContent(validated.content);

    const lesson = await db.lesson.update({
      where: { id: validated.lessonId },
      data: {
        title: validated.title,
        content: sanitizedContent as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/");
    return { success: true, data: lesson };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteLesson(lessonId: string) {
  try {
    if (!lessonId) {
      return { success: false, error: "Lesson ID is required" };
    }

    await db.lesson.delete({
      where: { id: lessonId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getLessons(yearId: string) {
  try {
    if (!yearId) {
      return { success: false, error: "Year ID is required" };
    }

    const lessons = await db.lesson.findMany({
      where: { yearId },
      orderBy: { createdAt: "desc" },
      include: {
        highlights: {
          include: {
            tags: true,
          },
        },
      },
    });

    return { success: true, data: lessons };
  } catch (error) {
    return handleActionError(error);
  }
}

// Creative Dump Actions
export async function createCreativeNote(
  yearId: string,
  content?: TiptapContent
) {
  try {
    // Validate and sanitize input
    const validated = createCreativeNoteSchema.parse({ yearId, content });
    const sanitizedContent = validated.content
      ? sanitizeTiptapContent(validated.content)
      : undefined;

    const note = await db.creativeNote.create({
      data: {
        content: sanitizedContent as Prisma.InputJsonValue,
        yearId: validated.yearId,
      },
      include: {
        highlights: {
          include: {
            tags: true,
          },
        },
      },
    });

    revalidatePath("/");
    return { success: true, data: note };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateCreativeNote(
  noteId: string,
  content: TiptapContent
) {
  try {
    // Validate and sanitize using the schema
    const validated = updateCreativeNoteSchema.parse({ noteId, content });
    const sanitizedContent = sanitizeTiptapContent(validated.content);

    const note = await db.creativeNote.update({
      where: { id: validated.noteId },
      data: { content: sanitizedContent as Prisma.InputJsonValue },
    });

    revalidatePath("/");
    return { success: true, data: note };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteCreativeNote(noteId: string) {
  try {
    await db.creativeNote.delete({
      where: { id: noteId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting creative note:", error);
    return { success: false, error: "Failed to delete creative note" };
  }
}

export async function getCreativeNotes(yearId: string) {
  try {
    const notes = await db.creativeNote.findMany({
      where: { yearId },
      orderBy: { createdAt: "desc" },
      include: {
        highlights: {
          include: {
            tags: true,
          },
        },
      },
    });

    return { success: true, data: notes };
  } catch (error) {
    console.error("Error fetching creative notes:", error);
    return { success: false, error: "Failed to fetch creative notes" };
  }
}

// Highlight and Tag Actions
export async function createHighlight(
  entityType:
    | "dailyLog"
    | "quarterlyReflection"
    | "goal"
    | "task"
    | "subtask"
    | "chapter"
    | "lesson"
    | "creativeNote",
  entityId: string,
  text: string,
  startOffset: number,
  endOffset: number,
  tiptapId: string,
  tagIds?: string[]
) {
  try {
    // Validate input (including tiptapId)
    const validated = createHighlightSchema.parse({
      entityType,
      entityId,
      text,
      startOffset,
      endOffset,
      tiptapId,
      tagIds,
    });

    // Validate offset relationship
    if (validated.endOffset <= validated.startOffset) {
      return {
        success: false,
        error: "End offset must be greater than start offset",
      };
    }

    // Build data object for Prisma
    const data: any = {
      text: validated.text,
      startOffset: validated.startOffset,
      endOffset: validated.endOffset,
      tiptapId: validated.tiptapId,
      tags:
        validated.tagIds && validated.tagIds.length > 0
          ? {
              connect: validated.tagIds.map((id) => ({ id })),
            }
          : undefined,
    };

    // Dynamically add the related entity field
    switch (validated.entityType) {
      case "dailyLog":
        data.dailyLogId = validated.entityId;
        break;
      case "quarterlyReflection":
        data.quarterlyReflectionId = validated.entityId;
        break;
      case "goal":
        data.goalId = validated.entityId;
        break;
      case "task":
        data.taskId = validated.entityId;
        break;
      case "subtask":
        data.subtaskId = validated.entityId;
        break;
      case "chapter":
        data.chapterId = validated.entityId;
        break;
      case "lesson":
        data.lessonId = validated.entityId;
        break;
      case "creativeNote":
        data.creativeNoteId = validated.entityId;
        break;
    }

    const highlight = await db.highlight.create({
      data,
      include: {
        tags: true,
      },
    });

    try {
      revalidatePath("/");
    } catch (e) {
      // Ignore revalidation errors in test environment
    }
    return { success: true, data: highlight };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createTag(userId: string, name: string) {
  try {
    // Validate input
    const validated = createTagSchema.parse({ userId, name });

    const tag = await db.tag.create({
      data: {
        name: validated.name,
        userId: validated.userId,
      },
    });

    try {
      revalidatePath("/");
    } catch (e) {
      // Ignore revalidation errors in test environment
    }
    return { success: true, data: tag };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getOrCreateTags(userId: string, tagNames: string[]) {
  try {
    // Validate input
    const validated = getOrCreateTagsSchema.parse({ userId, tagNames });

    const tags = await Promise.all(
      validated.tagNames.map(async (name) => {
        // Try to find existing tag
        let tag = await db.tag.findUnique({
          where: {
            userId_name: {
              userId: validated.userId,
              name,
            },
          },
        });

        // Create if doesn't exist
        if (!tag) {
          tag = await db.tag.create({
            data: {
              name,
              userId: validated.userId,
            },
          });
        }

        return tag;
      })
    );

    return { success: true, data: tags };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getTags(userId: string) {
  try {
    const tags = await db.tag.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { highlights: true },
        },
      },
    });

    return { success: true, data: tags };
  } catch (error) {
    console.error("Error fetching tags:", error);
    return { success: false, error: "Failed to fetch tags" };
  }
}

export async function getHighlightsByTag(tagId: string) {
  try {
    const highlights = await db.highlight.findMany({
      where: {
        tags: {
          some: { id: tagId },
        },
      },
      include: {
        tags: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: highlights };
  } catch (error) {
    console.error("Error fetching highlights by tag:", error);
    return { success: false, error: "Failed to fetch highlights" };
  }
}

export async function getTaggedContentByTag(userId: string, tagId: string) {
  try {
    const highlights = await db.highlight.findMany({
      where: {
        tags: {
          some: { id: tagId },
        },
      },
      include: {
        tags: true,
        dailyLog: {
          include: {
            year: true,
          },
        },
        quarterlyReflection: {
          include: {
            year: true,
          },
        },
        goal: {
          include: {
            year: true,
          },
        },
        task: {
          include: {
            goal: {
              include: {
                year: true,
              },
            },
          },
        },
        subtask: {
          include: {
            task: {
              include: {
                goal: {
                  include: {
                    year: true,
                  },
                },
              },
            },
          },
        },
        chapter: {
          include: {
            book: {
              include: {
                genre: {
                  include: {
                    year: true,
                  },
                },
              },
            },
          },
        },
        lesson: {
          include: {
            year: true,
          },
        },
        creativeNote: {
          include: {
            year: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform highlights into tagged content with source information
    const taggedContent = highlights.map((highlight: any) => {
      type SectionType =
        | "daily-logs"
        | "quarterly-reflections"
        | "yearly-goals"
        | "book-notes"
        | "lessons-learned"
        | "creative-dump";

      let source: {
        year: number;
        section: SectionType;
        itemId: string;
        itemTitle: string;
      } | null = null;

      if (highlight.dailyLog) {
        source = {
          year: highlight.dailyLog.year.year,
          section: "daily-logs" as const,
          itemId: highlight.dailyLog.id,
          itemTitle: highlight.dailyLog.date.toLocaleDateString(),
        };
      } else if (highlight.quarterlyReflection) {
        source = {
          year: highlight.quarterlyReflection.year.year,
          section: "quarterly-reflections" as const,
          itemId: highlight.quarterlyReflection.id,
          itemTitle: `Q${highlight.quarterlyReflection.quarter} Reflection`,
        };
      } else if (highlight.goal) {
        source = {
          year: highlight.goal.year.year,
          section: "yearly-goals" as const,
          itemId: highlight.goal.id,
          itemTitle: highlight.goal.title,
        };
      } else if (highlight.task) {
        source = {
          year: highlight.task.goal.year.year,
          section: "yearly-goals" as const,
          itemId: highlight.task.id,
          itemTitle: `${highlight.task.goal.title} > ${highlight.task.title}`,
        };
      } else if (highlight.subtask) {
        source = {
          year: highlight.subtask.task.goal.year.year,
          section: "yearly-goals" as const,
          itemId: highlight.subtask.id,
          itemTitle: `${highlight.subtask.task.goal.title} > ${highlight.subtask.task.title} > ${highlight.subtask.title}`,
        };
      } else if (highlight.chapter) {
        source = {
          year: highlight.chapter.book.genre.year.year,
          section: "book-notes" as const,
          itemId: highlight.chapter.id,
          itemTitle: `${highlight.chapter.book.genre.name} > ${highlight.chapter.book.title} > ${highlight.chapter.title}`,
        };
      } else if (highlight.lesson) {
        source = {
          year: highlight.lesson.year.year,
          section: "lessons-learned" as const,
          itemId: highlight.lesson.id,
          itemTitle: highlight.lesson.title,
        };
      } else if (highlight.creativeNote) {
        source = {
          year: highlight.creativeNote.year.year,
          section: "creative-dump" as const,
          itemId: highlight.creativeNote.id,
          itemTitle: `Note from ${highlight.creativeNote.createdAt.toLocaleDateString()}`,
        };
      }

      return {
        id: highlight.id,
        tiptapId: highlight.tiptapId,
        text: highlight.text,
        source,
        createdAt: highlight.createdAt,
        tags: highlight.tags,
      };
    });

    // Filter out any highlights without a valid source
    const validContent = taggedContent.filter(
      (content) => content.source !== null
    );

    return { success: true, data: validContent };
  } catch (error) {
    console.error("Error fetching tagged content by tag:", error);
    return { success: false, error: "Failed to fetch tagged content" };
  }
}

export async function getAllTaggedContent(userId: string) {
  try {
    // Get all user's tags
    const tags = await db.tag.findMany({
      where: { userId },
      include: {
        highlights: {
          include: {
            tags: true,
            dailyLog: {
              include: {
                year: true,
              },
            },
            quarterlyReflection: {
              include: {
                year: true,
              },
            },
            goal: {
              include: {
                year: true,
              },
            },
            task: {
              include: {
                goal: {
                  include: {
                    year: true,
                  },
                },
              },
            },
            subtask: {
              include: {
                task: {
                  include: {
                    goal: {
                      include: {
                        year: true,
                      },
                    },
                  },
                },
              },
            },
            chapter: {
              include: {
                book: {
                  include: {
                    genre: {
                      include: {
                        year: true,
                      },
                    },
                  },
                },
              },
            },
            lesson: {
              include: {
                year: true,
              },
            },
            creativeNote: {
              include: {
                year: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // Transform into a more usable format
    const taggedContentByTag = tags.map((tag) => {
      const content = tag.highlights.map((highlight: any) => {
        type SectionType =
          | "daily-logs"
          | "quarterly-reflections"
          | "yearly-goals"
          | "book-notes"
          | "lessons-learned"
          | "creative-dump";

        let source: {
          year: number;
          section: SectionType;
          itemId: string;
          itemTitle: string;
        } | null = null;

        if (highlight.dailyLog) {
          source = {
            year: highlight.dailyLog.year.year,
            section: "daily-logs" as const,
            itemId: highlight.dailyLog.id,
            itemTitle: highlight.dailyLog.date.toLocaleDateString(),
          };
        } else if (highlight.quarterlyReflection) {
          source = {
            year: highlight.quarterlyReflection.year.year,
            section: "quarterly-reflections" as const,
            itemId: highlight.quarterlyReflection.id,
            itemTitle: `Q${highlight.quarterlyReflection.quarter} Reflection`,
          };
        } else if (highlight.goal) {
          source = {
            year: highlight.goal.year.year,
            section: "yearly-goals" as const,
            itemId: highlight.goal.id,
            itemTitle: highlight.goal.title,
          };
        } else if (highlight.task) {
          source = {
            year: highlight.task.goal.year.year,
            section: "yearly-goals" as const,
            itemId: highlight.task.id,
            itemTitle: `${highlight.task.goal.title} > ${highlight.task.title}`,
          };
        } else if (highlight.subtask) {
          source = {
            year: highlight.subtask.task.goal.year.year,
            section: "yearly-goals" as const,
            itemId: highlight.subtask.id,
            itemTitle: `${highlight.subtask.task.goal.title} > ${highlight.subtask.task.title} > ${highlight.subtask.title}`,
          };
        } else if (highlight.chapter) {
          source = {
            year: highlight.chapter.book.genre.year.year,
            section: "book-notes" as const,
            itemId: highlight.chapter.id,
            itemTitle: `${highlight.chapter.book.genre.name} > ${highlight.chapter.book.title} > ${highlight.chapter.title}`,
          };
        } else if (highlight.lesson) {
          source = {
            year: highlight.lesson.year.year,
            section: "lessons-learned" as const,
            itemId: highlight.lesson.id,
            itemTitle: highlight.lesson.title,
          };
        } else if (highlight.creativeNote) {
          source = {
            year: highlight.creativeNote.year.year,
            section: "creative-dump" as const,
            itemId: highlight.creativeNote.id,
            itemTitle: `Note from ${highlight.creativeNote.createdAt.toLocaleDateString()}`,
          };
        }

        return {
          id: highlight.id,
          tiptapId: highlight.tiptapId,
          text: highlight.text,
          source,
          createdAt: highlight.createdAt,
          tags: highlight.tags,
        };
      });

      return {
        tag: {
          id: tag.id,
          name: tag.name,
          highlightCount: tag.highlights.length,
        },
        content: content.filter((c) => c.source !== null),
      };
    });

    return { success: true, data: taggedContentByTag };
  } catch (error) {
    console.error("Error fetching all tagged content:", error);
    return { success: false, error: "Failed to fetch tagged content" };
  }
}

// Search Actions
export async function searchContent(yearId: string, query: string) {
  try {
    const searchResults = await Promise.all([
      // Search goals by title
      db.goal.findMany({
        where: {
          yearId,
          title: { contains: query, mode: "insensitive" },
        },
        include: {
          tasks: {
            include: { subtasks: true },
          },
          highlights: {
            include: { tags: true },
          },
        },
      }),

      // Search lessons by title
      db.lesson.findMany({
        where: {
          yearId,
          title: { contains: query, mode: "insensitive" },
        },
        include: {
          highlights: {
            include: { tags: true },
          },
        },
      }),

      // Search book chapters by title
      db.chapter.findMany({
        where: {
          book: {
            genre: { yearId },
          },
          title: { contains: query, mode: "insensitive" },
        },
        include: {
          book: {
            include: { genre: true },
          },
          highlights: {
            include: { tags: true },
          },
        },
      }),

      // Search highlights by text
      db.highlight.findMany({
        where: {
          text: { contains: query, mode: "insensitive" },
          OR: [
            { dailyLog: { yearId } },
            { quarterlyReflection: { yearId } },
            { goal: { yearId } },
            { lesson: { yearId } },
            { creativeNote: { yearId } },
            { chapter: { book: { genre: { yearId } } } },
          ],
        },
        include: {
          tags: true,
          dailyLog: true,
          quarterlyReflection: true,
          goal: true,
          task: true,
          subtask: true,
          lesson: true,
          creativeNote: true,
          chapter: {
            include: {
              book: {
                include: { genre: true },
              },
            },
          },
        },
      }),
    ]);

    const [goals, lessons, chapters, highlights] = searchResults;

    return {
      success: true,
      data: {
        goals,
        lessons,
        chapters,
        highlights,
      },
    };
  } catch (error) {
    console.error("Error searching content:", error);
    return { success: false, error: "Failed to search content" };
  }
}
