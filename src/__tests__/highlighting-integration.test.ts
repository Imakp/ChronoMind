import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { db } from "../lib/db";
import {
  createHighlight,
  getOrCreateTags,
  getTaggedContentByTag,
} from "../lib/actions";

describe("Highlighting System Integration Tests", () => {
  let testUserId: string;
  let testYear1Id: string;
  let testYear2Id: string;
  let testTag1Id: string;
  let testTag2Id: string;
  let testTag3Id: string;

  // Content IDs for different sections
  let testDailyLogId: string;
  let testQuarterlyReflectionId: string;
  let testGoalId: string;
  let testTaskId: string;
  let testSubTaskId: string;
  let testChapterId: string;
  let testLessonId: string;
  let testCreativeNoteId: string;

  before(async () => {
    // Create a test user
    const user = await db.user.create({
      data: {
        email: `test-highlight-${Date.now()}@example.com`,
        name: "Test User",
      },
    });
    testUserId = user.id;

    // Create two test years
    const year1 = await db.year.create({
      data: {
        year: 2024,
        userId: testUserId,
      },
    });
    testYear1Id = year1.id;

    const year2 = await db.year.create({
      data: {
        year: 2025,
        userId: testUserId,
      },
    });
    testYear2Id = year2.id;

    // Create tags
    const tagsResult = await getOrCreateTags(testUserId, [
      "productivity",
      "learning",
      "insights",
    ]);
    assert.ok(tagsResult.success && tagsResult.data);
    testTag1Id = tagsResult.data[0].id;
    testTag2Id = tagsResult.data[1].id;
    testTag3Id = tagsResult.data[2].id;

    // Create content in all sections

    // 1. Daily Log
    const dailyLog = await db.dailyLog.create({
      data: {
        date: new Date("2024-01-15"),
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Today I learned about React hooks" },
              ],
            },
          ],
        } as any,
        yearId: testYear1Id,
      },
    });
    testDailyLogId = dailyLog.id;

    // 2. Quarterly Reflection
    const quarterlyReflection = await db.quarterlyReflection.create({
      data: {
        quarter: 1,
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Q1 was focused on improving productivity",
                },
              ],
            },
          ],
        } as any,
        yearId: testYear1Id,
      },
    });
    testQuarterlyReflectionId = quarterlyReflection.id;

    // 3. Goal, Task, SubTask
    const goal = await db.goal.create({
      data: {
        title: "Master TypeScript",
        description: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Become proficient in TypeScript for better code quality",
                },
              ],
            },
          ],
        } as any,
        yearId: testYear2Id,
      },
    });
    testGoalId = goal.id;

    const task = await db.task.create({
      data: {
        title: "Complete TypeScript course",
        description: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Focus on advanced types and generics",
                },
              ],
            },
          ],
        } as any,
        goalId: goal.id,
      },
    });
    testTaskId = task.id;

    const subtask = await db.subTask.create({
      data: {
        title: "Learn about utility types",
        taskId: task.id,
      },
    });
    testSubTaskId = subtask.id;

    // 4. Book Notes (Genre > Book > Chapter)
    const genre = await db.genre.create({
      data: {
        name: "Technical",
        yearId: testYear1Id,
      },
    });

    const book = await db.book.create({
      data: {
        title: "Clean Code",
        genreId: genre.id,
      },
    });

    const chapter = await db.chapter.create({
      data: {
        title: "Chapter 1: Clean Code",
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Writing clean code is essential for maintainability",
                },
              ],
            },
          ],
        } as any,
        bookId: book.id,
      },
    });
    testChapterId = chapter.id;

    // 5. Lesson
    const lesson = await db.lesson.create({
      data: {
        title: "Code Review Best Practices",
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Always be constructive and specific in feedback",
                },
              ],
            },
          ],
        } as any,
        yearId: testYear2Id,
      },
    });
    testLessonId = lesson.id;

    // 6. Creative Note
    const creativeNote = await db.creativeNote.create({
      data: {
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Idea: Build a tool for tracking learning progress",
                },
              ],
            },
          ],
        } as any,
        yearId: testYear2Id,
      },
    });
    testCreativeNoteId = creativeNote.id;
  });

  after(async () => {
    // Clean up test data in correct order
    try {
      if (testYear1Id) {
        await db.highlight.deleteMany({
          where: {
            OR: [
              { dailyLog: { yearId: testYear1Id } },
              { quarterlyReflection: { yearId: testYear1Id } },
              { goal: { yearId: testYear1Id } },
              { task: { goal: { yearId: testYear1Id } } },
              { subtask: { task: { goal: { yearId: testYear1Id } } } },
              { chapter: { book: { genre: { yearId: testYear1Id } } } },
            ],
          },
        });
        await db.subTask.deleteMany({
          where: { task: { goal: { yearId: testYear1Id } } },
        });
        await db.task.deleteMany({
          where: { goal: { yearId: testYear1Id } },
        });
        await db.goal.deleteMany({ where: { yearId: testYear1Id } });
        await db.chapter.deleteMany({
          where: { book: { genre: { yearId: testYear1Id } } },
        });
        await db.book.deleteMany({
          where: { genre: { yearId: testYear1Id } },
        });
        await db.genre.deleteMany({ where: { yearId: testYear1Id } });
        await db.dailyLog.deleteMany({ where: { yearId: testYear1Id } });
        await db.quarterlyReflection.deleteMany({
          where: { yearId: testYear1Id },
        });
        await db.year.delete({ where: { id: testYear1Id } });
      }
      if (testYear2Id) {
        await db.highlight.deleteMany({
          where: {
            OR: [
              { goal: { yearId: testYear2Id } },
              { task: { goal: { yearId: testYear2Id } } },
              { subtask: { task: { goal: { yearId: testYear2Id } } } },
              { lesson: { yearId: testYear2Id } },
              { creativeNote: { yearId: testYear2Id } },
            ],
          },
        });
        await db.subTask.deleteMany({
          where: { task: { goal: { yearId: testYear2Id } } },
        });
        await db.task.deleteMany({
          where: { goal: { yearId: testYear2Id } },
        });
        await db.goal.deleteMany({ where: { yearId: testYear2Id } });
        await db.lesson.deleteMany({ where: { yearId: testYear2Id } });
        await db.creativeNote.deleteMany({ where: { yearId: testYear2Id } });
        await db.year.delete({ where: { id: testYear2Id } });
      }
      if (testUserId) {
        await db.tag.deleteMany({ where: { userId: testUserId } });
        await db.user.delete({ where: { id: testUserId } });
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  it("should create highlight on daily log with tags", async () => {
    const result = await createHighlight(
      "dailyLog",
      testDailyLogId,
      "learned about React hooks",
      8,
      33,
      [testTag2Id]
    );

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.text, "learned about React hooks");
    assert.strictEqual(result.data.dailyLogId, testDailyLogId);
    assert.strictEqual(result.data.tags.length, 1);
    assert.strictEqual(result.data.tags[0].id, testTag2Id);
  });

  it("should create highlight on quarterly reflection with multiple tags", async () => {
    const result = await createHighlight(
      "quarterlyReflection",
      testQuarterlyReflectionId,
      "improving productivity",
      19,
      41,
      [testTag1Id, testTag3Id]
    );

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.text, "improving productivity");
    assert.strictEqual(
      result.data.quarterlyReflectionId,
      testQuarterlyReflectionId
    );
    assert.strictEqual(result.data.tags.length, 2);
  });

  it("should create highlight on goal with tags", async () => {
    const result = await createHighlight(
      "goal",
      testGoalId,
      "better code quality",
      48,
      67,
      [testTag2Id, testTag3Id]
    );

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.text, "better code quality");
    assert.strictEqual(result.data.goalId, testGoalId);
    assert.strictEqual(result.data.tags.length, 2);
  });

  it("should create highlight on task with tags", async () => {
    const result = await createHighlight(
      "task",
      testTaskId,
      "advanced types and generics",
      10,
      36,
      [testTag2Id]
    );

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.text, "advanced types and generics");
    assert.strictEqual(result.data.taskId, testTaskId);
    assert.strictEqual(result.data.tags.length, 1);
  });

  it("should create highlight on subtask with tags", async () => {
    const result = await createHighlight(
      "subtask",
      testSubTaskId,
      "utility types",
      13,
      26,
      [testTag2Id]
    );

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.text, "utility types");
    assert.strictEqual(result.data.subtaskId, testSubTaskId);
    assert.strictEqual(result.data.tags.length, 1);
  });

  it("should create highlight on chapter with tags", async () => {
    const result = await createHighlight(
      "chapter",
      testChapterId,
      "clean code is essential",
      8,
      31,
      [testTag3Id]
    );

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.text, "clean code is essential");
    assert.strictEqual(result.data.chapterId, testChapterId);
    assert.strictEqual(result.data.tags.length, 1);
  });

  it("should create highlight on lesson with tags", async () => {
    const result = await createHighlight(
      "lesson",
      testLessonId,
      "constructive and specific",
      10,
      34,
      [testTag3Id, testTag1Id]
    );

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.text, "constructive and specific");
    assert.strictEqual(result.data.lessonId, testLessonId);
    assert.strictEqual(result.data.tags.length, 2);
  });

  it("should create highlight on creative note with tags", async () => {
    const result = await createHighlight(
      "creativeNote",
      testCreativeNoteId,
      "tracking learning progress",
      23,
      48,
      [testTag2Id, testTag1Id]
    );

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.text, "tracking learning progress");
    assert.strictEqual(result.data.creativeNoteId, testCreativeNoteId);
    assert.strictEqual(result.data.tags.length, 2);
  });

  it("should retrieve highlights across all sections by tag", async () => {
    const result = await getTaggedContentByTag(testUserId, testTag2Id);

    assert.ok(result.success);
    assert.ok(result.data);
    // Should have highlights from: daily log, goal, task, subtask, creative note
    assert.ok(result.data.length >= 5);

    const sections = result.data.map((c) => c.source?.section);
    assert.ok(sections.includes("daily-logs"));
    assert.ok(sections.includes("yearly-goals"));
    assert.ok(sections.includes("creative-dump"));
  });

  it("should retrieve highlights from multiple years", async () => {
    const result = await getTaggedContentByTag(testUserId, testTag2Id);

    assert.ok(result.success);
    assert.ok(result.data);

    const years = result.data.map((c) => c.source?.year);
    assert.ok(years.includes(2024)); // Daily log
    assert.ok(years.includes(2025)); // Goal, creative note
  });

  it("should include correct source information for daily log", async () => {
    const result = await getTaggedContentByTag(testUserId, testTag2Id);

    assert.ok(result.success);
    assert.ok(result.data);

    const dailyLogContent = result.data.find(
      (c) => c.source?.section === "daily-logs"
    );
    assert.ok(dailyLogContent);
    assert.strictEqual(dailyLogContent.source?.year, 2024);
    assert.ok(dailyLogContent.source?.itemTitle.includes("1/15/2024"));
  });

  it("should include correct source information for quarterly reflection", async () => {
    const result = await getTaggedContentByTag(testUserId, testTag1Id);

    assert.ok(result.success);
    assert.ok(result.data);

    const reflectionContent = result.data.find(
      (c) => c.source?.section === "quarterly-reflections"
    );
    assert.ok(reflectionContent);
    assert.strictEqual(reflectionContent.source?.year, 2024);
    assert.strictEqual(reflectionContent.source?.itemTitle, "Q1 Reflection");
  });

  it("should include correct hierarchical source information for goal", async () => {
    const result = await getTaggedContentByTag(testUserId, testTag2Id);

    assert.ok(result.success);
    assert.ok(result.data);

    const goalContent = result.data.find(
      (c) => c.text === "better code quality"
    );
    assert.ok(goalContent);
    assert.strictEqual(goalContent.source?.year, 2025);
    assert.strictEqual(goalContent.source?.section, "yearly-goals");
    assert.strictEqual(goalContent.source?.itemTitle, "Master TypeScript");
  });

  it("should include correct hierarchical source information for task", async () => {
    const result = await getTaggedContentByTag(testUserId, testTag2Id);

    assert.ok(result.success);
    assert.ok(result.data);

    const taskContent = result.data.find(
      (c) => c.text === "advanced types and generics"
    );
    assert.ok(taskContent);
    assert.strictEqual(taskContent.source?.year, 2025);
    assert.ok(taskContent.source?.itemTitle.includes("Master TypeScript"));
    assert.ok(
      taskContent.source?.itemTitle.includes("Complete TypeScript course")
    );
  });

  it("should include correct hierarchical source information for subtask", async () => {
    const result = await getTaggedContentByTag(testUserId, testTag2Id);

    assert.ok(result.success);
    assert.ok(result.data);

    const subtaskContent = result.data.find((c) => c.text === "utility types");
    assert.ok(subtaskContent);
    assert.strictEqual(subtaskContent.source?.year, 2025);
    assert.ok(subtaskContent.source?.itemTitle.includes("Master TypeScript"));
    assert.ok(
      subtaskContent.source?.itemTitle.includes("Complete TypeScript course")
    );
    assert.ok(
      subtaskContent.source?.itemTitle.includes("Learn about utility types")
    );
  });

  it("should include correct hierarchical source information for chapter", async () => {
    const result = await getTaggedContentByTag(testUserId, testTag3Id);

    assert.ok(result.success);
    assert.ok(result.data);

    const chapterContent = result.data.find(
      (c) => c.text === "clean code is essential"
    );
    assert.ok(chapterContent);
    assert.strictEqual(chapterContent.source?.year, 2024);
    assert.strictEqual(chapterContent.source?.section, "book-notes");
    assert.ok(chapterContent.source?.itemTitle.includes("Technical"));
    assert.ok(chapterContent.source?.itemTitle.includes("Clean Code"));
    assert.ok(chapterContent.source?.itemTitle.includes("Chapter 1"));
  });

  it("should include correct source information for lesson", async () => {
    const result = await getTaggedContentByTag(testUserId, testTag3Id);

    assert.ok(result.success);
    assert.ok(result.data);

    const lessonContent = result.data.find(
      (c) => c.source?.section === "lessons-learned"
    );
    assert.ok(lessonContent);
    assert.strictEqual(lessonContent.source?.year, 2025);
    assert.strictEqual(
      lessonContent.source?.itemTitle,
      "Code Review Best Practices"
    );
  });

  it("should include correct source information for creative note", async () => {
    const result = await getTaggedContentByTag(testUserId, testTag2Id);

    assert.ok(result.success);
    assert.ok(result.data);

    const creativeContent = result.data.find(
      (c) => c.source?.section === "creative-dump"
    );
    assert.ok(creativeContent);
    assert.strictEqual(creativeContent.source?.year, 2025);
    assert.ok(creativeContent.source?.itemTitle.includes("Note from"));
  });

  it("should support highlights with no tags", async () => {
    const result = await createHighlight(
      "dailyLog",
      testDailyLogId,
      "untagged highlight",
      0,
      18,
      []
    );

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.tags.length, 0);
  });

  it("should support multiple highlights on same content", async () => {
    const result1 = await createHighlight(
      "lesson",
      testLessonId,
      "first highlight",
      0,
      15,
      [testTag1Id]
    );

    const result2 = await createHighlight(
      "lesson",
      testLessonId,
      "second highlight",
      20,
      36,
      [testTag2Id]
    );

    assert.ok(result1.success);
    assert.ok(result2.success);

    // Verify both highlights exist
    const highlights = await db.highlight.findMany({
      where: { lessonId: testLessonId },
    });

    assert.ok(highlights.length >= 3); // Including the one created earlier
  });

  it("should preserve highlight offsets correctly", async () => {
    const result = await createHighlight(
      "chapter",
      testChapterId,
      "test text",
      10,
      19,
      [testTag1Id]
    );

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.startOffset, 10);
    assert.strictEqual(result.data.endOffset, 19);
  });

  it("should order highlights by creation date", async () => {
    const result = await getTaggedContentByTag(testUserId, testTag2Id);

    assert.ok(result.success);
    assert.ok(result.data);
    assert.ok(result.data.length >= 2);

    // Verify ordering (newest first)
    for (let i = 0; i < result.data.length - 1; i++) {
      const currentDate = new Date(result.data[i].createdAt);
      const nextDate = new Date(result.data[i + 1].createdAt);
      assert.ok(currentDate >= nextDate);
    }
  });

  it("should handle highlights with special characters", async () => {
    const specialText = 'Text with "quotes" and special chars: @#$%';
    const result = await createHighlight(
      "creativeNote",
      testCreativeNoteId,
      specialText,
      0,
      specialText.length,
      [testTag1Id]
    );

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.text, specialText);
  });

  it("should retrieve all highlights when fetching content with includes", async () => {
    const dailyLog = await db.dailyLog.findUnique({
      where: { id: testDailyLogId },
      include: {
        highlights: {
          include: {
            tags: true,
          },
        },
      },
    });

    assert.ok(dailyLog);
    assert.ok(dailyLog.highlights);
    assert.ok(dailyLog.highlights.length >= 2);
    assert.ok(dailyLog.highlights.every((h) => Array.isArray(h.tags)));
  });
});
