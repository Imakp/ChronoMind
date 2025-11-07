"use server";

import { db } from "./db";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

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
    const newYear = await db.year.create({
      data: {
        year,
        userId,
      },
    });

    revalidatePath("/");
    return { success: true, data: newYear };
  } catch (error) {
    console.error("Error creating year:", error);
    return { success: false, error: "Failed to create year" };
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
    const updatedLog = await db.dailyLog.update({
      where: { id: logId },
      data: { content: content as Prisma.InputJsonValue },
    });

    revalidatePath("/");
    return { success: true, data: updatedLog };
  } catch (error) {
    console.error("Error updating daily log:", error);
    return { success: false, error: "Failed to update daily log" };
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
    const reflection = await db.quarterlyReflection.upsert({
      where: {
        yearId_quarter: {
          yearId,
          quarter,
        },
      },
      update: {
        content: content as Prisma.InputJsonValue,
      },
      create: {
        yearId,
        quarter,
        content: content as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/");
    return { success: true, data: reflection };
  } catch (error) {
    console.error("Error updating quarterly reflection:", error);
    return { success: false, error: "Failed to update quarterly reflection" };
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
    const goal = await db.goal.create({
      data: {
        title,
        description: description as Prisma.InputJsonValue,
        yearId,
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
    console.error("Error creating goal:", error);
    return { success: false, error: "Failed to create goal" };
  }
}

export async function createTask(
  goalId: string,
  title: string,
  description?: TiptapContent
) {
  try {
    const task = await db.task.create({
      data: {
        title,
        description: description as Prisma.InputJsonValue,
        goalId,
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
    console.error("Error creating task:", error);
    return { success: false, error: "Failed to create task" };
  }
}

export async function createSubTask(taskId: string, title: string) {
  try {
    const subtask = await db.subTask.create({
      data: {
        title,
        taskId,
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
    console.error("Error creating subtask:", error);
    return { success: false, error: "Failed to create subtask" };
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
    console.error("Error fetching goals:", error);
    return { success: false, error: "Failed to fetch goals" };
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
    const chapter = await db.chapter.create({
      data: {
        title,
        content: content as Prisma.InputJsonValue,
        bookId,
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
    console.error("Error creating chapter:", error);
    return { success: false, error: "Failed to create chapter" };
  }
}

export async function updateChapter(chapterId: string, content: TiptapContent) {
  try {
    const chapter = await db.chapter.update({
      where: { id: chapterId },
      data: { content: content as Prisma.InputJsonValue },
    });

    revalidatePath("/");
    return { success: true, data: chapter };
  } catch (error) {
    console.error("Error updating chapter:", error);
    return { success: false, error: "Failed to update chapter" };
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
    const lesson = await db.lesson.create({
      data: {
        title,
        content: content as Prisma.InputJsonValue,
        yearId,
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
    console.error("Error creating lesson:", error);
    return { success: false, error: "Failed to create lesson" };
  }
}

export async function updateLesson(
  lessonId: string,
  title: string,
  content: TiptapContent
) {
  try {
    const lesson = await db.lesson.update({
      where: { id: lessonId },
      data: {
        title,
        content: content as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/");
    return { success: true, data: lesson };
  } catch (error) {
    console.error("Error updating lesson:", error);
    return { success: false, error: "Failed to update lesson" };
  }
}

export async function deleteLesson(lessonId: string) {
  try {
    await db.lesson.delete({
      where: { id: lessonId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return { success: false, error: "Failed to delete lesson" };
  }
}

export async function getLessons(yearId: string) {
  try {
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
    console.error("Error fetching lessons:", error);
    return { success: false, error: "Failed to fetch lessons" };
  }
}

// Creative Dump Actions
export async function createCreativeNote(
  yearId: string,
  content?: TiptapContent
) {
  try {
    const note = await db.creativeNote.create({
      data: {
        content: content as Prisma.InputJsonValue,
        yearId,
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
    console.error("Error creating creative note:", error);
    return { success: false, error: "Failed to create creative note" };
  }
}

export async function updateCreativeNote(
  noteId: string,
  content: TiptapContent
) {
  try {
    const note = await db.creativeNote.update({
      where: { id: noteId },
      data: { content: content as Prisma.InputJsonValue },
    });

    revalidatePath("/");
    return { success: true, data: note };
  } catch (error) {
    console.error("Error updating creative note:", error);
    return { success: false, error: "Failed to update creative note" };
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
  tagIds?: string[]
) {
  try {
    // Create the base data object
    const data: any = {
      text,
      startOffset,
      endOffset,
      tags:
        tagIds && tagIds.length > 0 && tagIds.every((id) => id)
          ? {
              connect: tagIds.map((id) => ({ id })),
            }
          : undefined,
    };

    // Add the appropriate entity relation
    switch (entityType) {
      case "dailyLog":
        data.dailyLogId = entityId;
        break;
      case "quarterlyReflection":
        data.quarterlyReflectionId = entityId;
        break;
      case "goal":
        data.goalId = entityId;
        break;
      case "task":
        data.taskId = entityId;
        break;
      case "subtask":
        data.subtaskId = entityId;
        break;
      case "chapter":
        data.chapterId = entityId;
        break;
      case "lesson":
        data.lessonId = entityId;
        break;
      case "creativeNote":
        data.creativeNoteId = entityId;
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
    console.error("Error creating highlight:", error);
    return { success: false, error: "Failed to create highlight" };
  }
}

export async function createTag(userId: string, name: string) {
  try {
    const tag = await db.tag.create({
      data: {
        name,
        userId,
      },
    });

    try {
      revalidatePath("/");
    } catch (e) {
      // Ignore revalidation errors in test environment
    }
    return { success: true, data: tag };
  } catch (error) {
    console.error("Error creating tag:", error);
    return { success: false, error: "Failed to create tag" };
  }
}

export async function getOrCreateTags(userId: string, tagNames: string[]) {
  try {
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        // Try to find existing tag
        let tag = await db.tag.findUnique({
          where: {
            userId_name: {
              userId,
              name,
            },
          },
        });

        // Create if doesn't exist
        if (!tag) {
          tag = await db.tag.create({
            data: {
              name,
              userId,
            },
          });
        }

        return tag;
      })
    );

    return { success: true, data: tags };
  } catch (error) {
    console.error("Error getting or creating tags:", error);
    return { success: false, error: "Failed to get or create tags" };
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
    const taggedContent = highlights.map((highlight) => {
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
      const content = tag.highlights.map((highlight) => {
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

// Utility Actions
export async function deleteGoal(goalId: string) {
  try {
    await db.goal.delete({
      where: { id: goalId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting goal:", error);
    return { success: false, error: "Failed to delete goal" };
  }
}

export async function deleteTask(taskId: string) {
  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: { goalId: true },
    });

    await db.task.delete({
      where: { id: taskId },
    });

    // Recalculate goal percentage
    if (task) {
      await recalculateGoalPercentage(task.goalId);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting task:", error);
    return { success: false, error: "Failed to delete task" };
  }
}

export async function deleteSubTask(subtaskId: string) {
  try {
    const subtask = await db.subTask.findUnique({
      where: { id: subtaskId },
      include: {
        task: {
          select: { id: true, goalId: true },
        },
      },
    });

    await db.subTask.delete({
      where: { id: subtaskId },
    });

    // Recalculate percentages
    if (subtask) {
      await recalculateTaskPercentage(subtask.task.id);
      await recalculateGoalPercentage(subtask.task.goalId);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting subtask:", error);
    return { success: false, error: "Failed to delete subtask" };
  }
}

export async function updateGoal(
  goalId: string,
  title: string,
  description?: TiptapContent
) {
  try {
    const goal = await db.goal.update({
      where: { id: goalId },
      data: {
        title,
        description: description as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/");
    return { success: true, data: goal };
  } catch (error) {
    console.error("Error updating goal:", error);
    return { success: false, error: "Failed to update goal" };
  }
}

export async function updateTask(
  taskId: string,
  title: string,
  description?: TiptapContent
) {
  try {
    const task = await db.task.update({
      where: { id: taskId },
      data: {
        title,
        description: description as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/");
    return { success: true, data: task };
  } catch (error) {
    console.error("Error updating task:", error);
    return { success: false, error: "Failed to update task" };
  }
}

export async function updateSubTask(subtaskId: string, title: string) {
  try {
    const subtask = await db.subTask.update({
      where: { id: subtaskId },
      data: { title },
    });

    revalidatePath("/");
    return { success: true, data: subtask };
  } catch (error) {
    console.error("Error updating subtask:", error);
    return { success: false, error: "Failed to update subtask" };
  }
}
