import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { db } from "../lib/db";
import {
  getTags,
  getTaggedContentByTag,
  getAllTaggedContent,
  createTag,
  getOrCreateTags,
  createHighlight,
} from "../lib/actions";

describe("Tag Explorer System", () => {
  let testUserId: string;
  let testYear1Id: string;
  let testYear2Id: string;
  let testDailyLogId: string;
  let testLessonId: string;
  let testChapterId: string;
  let testTag1Id: string;
  let testTag2Id: string;

  before(async () => {
    // Create a test user
    const user = await db.user.create({
      data: {
        email: `test-tags-${Date.now()}@example.com`,
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

    // Create test content in different sections
    const dailyLog = await db.dailyLog.create({
      data: {
        date: new Date("2024-01-15"),
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Daily log entry" }],
            },
          ],
        } as any,
        yearId: testYear1Id,
      },
    });
    testDailyLogId = dailyLog.id;

    const lesson = await db.lesson.create({
      data: {
        title: "Important Lesson",
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Lesson content" }],
            },
          ],
        } as any,
        yearId: testYear2Id,
      },
    });
    testLessonId = lesson.id;

    // Create book notes hierarchy
    const genre = await db.genre.create({
      data: {
        name: "Fiction",
        yearId: testYear1Id,
      },
    });

    const book = await db.book.create({
      data: {
        title: "Test Book",
        genreId: genre.id,
      },
    });

    const chapter = await db.chapter.create({
      data: {
        title: "Chapter 1",
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Chapter content" }],
            },
          ],
        } as any,
        bookId: book.id,
      },
    });
    testChapterId = chapter.id;
  });

  after(async () => {
    // Clean up test data in correct order
    try {
      if (testYear1Id) {
        // Delete highlights first
        await db.highlight.deleteMany({
          where: {
            OR: [
              { dailyLog: { yearId: testYear1Id } },
              { goal: { yearId: testYear1Id } },
              { task: { goal: { yearId: testYear1Id } } },
              { chapter: { book: { genre: { yearId: testYear1Id } } } },
            ],
          },
        });
        // Delete subtasks, tasks, goals
        await db.subTask.deleteMany({
          where: { task: { goal: { yearId: testYear1Id } } },
        });
        await db.task.deleteMany({
          where: { goal: { yearId: testYear1Id } },
        });
        await db.goal.deleteMany({ where: { yearId: testYear1Id } });
        // Delete book notes
        await db.chapter.deleteMany({
          where: { book: { genre: { yearId: testYear1Id } } },
        });
        await db.book.deleteMany({
          where: { genre: { yearId: testYear1Id } },
        });
        await db.genre.deleteMany({ where: { yearId: testYear1Id } });
        // Delete daily logs
        await db.dailyLog.deleteMany({ where: { yearId: testYear1Id } });
        // Delete year
        await db.year.delete({ where: { id: testYear1Id } });
      }
      if (testYear2Id) {
        await db.highlight.deleteMany({
          where: { lesson: { yearId: testYear2Id } },
        });
        await db.lesson.deleteMany({ where: { yearId: testYear2Id } });
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

  it("should create a tag", async () => {
    const result = await createTag(testUserId, "productivity");

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.name, "productivity");
    assert.strictEqual(result.data.userId, testUserId);

    testTag1Id = result.data.id;
  });

  it("should get or create tags (create new)", async () => {
    const result = await getOrCreateTags(testUserId, ["learning", "insights"]);

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.length, 2);
    assert.ok(result.data.some((tag) => tag.name === "learning"));
    assert.ok(result.data.some((tag) => tag.name === "insights"));

    testTag2Id = result.data.find((tag) => tag.name === "learning")!.id;
  });

  it("should get or create tags (return existing)", async () => {
    const result = await getOrCreateTags(testUserId, ["productivity"]);

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.length, 1);
    assert.strictEqual(result.data[0].id, testTag1Id);
  });

  it("should get all user tags with highlight counts", async () => {
    const result = await getTags(testUserId);

    assert.ok(result.success);
    assert.ok(result.data);
    assert.ok(result.data.length >= 3);
    assert.ok(result.data.every((tag) => tag.userId === testUserId));
    assert.ok(result.data.every((tag) => "_count" in tag));
  });

  it("should create a highlight with tags on daily log", async () => {
    const result = await createHighlight(
      "dailyLog",
      testDailyLogId,
      "This is important",
      0,
      17,
      [testTag1Id, testTag2Id]
    );

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.text, "This is important");
    assert.strictEqual(result.data.dailyLogId, testDailyLogId);
    assert.strictEqual(result.data.tags.length, 2);
  });

  it("should create a highlight with tags on lesson", async () => {
    const result = await createHighlight(
      "lesson",
      testLessonId,
      "Key insight here",
      0,
      16,
      [testTag2Id]
    );

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.text, "Key insight here");
    assert.strictEqual(result.data.lessonId, testLessonId);
    assert.strictEqual(result.data.tags.length, 1);
  });

  it("should create a highlight with tags on chapter", async () => {
    const result = await createHighlight(
      "chapter",
      testChapterId,
      "Interesting quote",
      0,
      17,
      [testTag1Id]
    );

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.text, "Interesting quote");
    assert.strictEqual(result.data.chapterId, testChapterId);
    assert.strictEqual(result.data.tags.length, 1);
  });

  it("should get tagged content by tag across years and sections", async () => {
    const result = await getTaggedContentByTag(testUserId, testTag1Id);

    assert.ok(result.success);
    assert.ok(result.data);
    assert.ok(result.data.length >= 2); // At least daily log and chapter

    // Check that content from different sections is included
    const sections = result.data.map((content) => content.source?.section);
    assert.ok(sections.includes("daily-logs"));
    assert.ok(sections.includes("book-notes"));

    // Check that content from different years is included
    const years = result.data.map((content) => content.source?.year);
    assert.ok(years.includes(2024));
  });

  it("should include source information in tagged content", async () => {
    const result = await getTaggedContentByTag(testUserId, testTag2Id);

    assert.ok(result.success);
    assert.ok(result.data);
    assert.ok(result.data.length >= 2);

    // Check daily log source
    const dailyLogContent = result.data.find(
      (c) => c.source?.section === "daily-logs"
    );
    assert.ok(dailyLogContent);
    assert.ok(dailyLogContent.source);
    assert.strictEqual(dailyLogContent.source.year, 2024);
    assert.strictEqual(dailyLogContent.source.section, "daily-logs");
    assert.ok(dailyLogContent.source.itemTitle.includes("1/15/2024"));

    // Check lesson source
    const lessonContent = result.data.find(
      (c) => c.source?.section === "lessons-learned"
    );
    assert.ok(lessonContent);
    assert.ok(lessonContent.source);
    assert.strictEqual(lessonContent.source.year, 2025);
    assert.strictEqual(lessonContent.source.section, "lessons-learned");
    assert.strictEqual(lessonContent.source.itemTitle, "Important Lesson");
  });

  it("should get all tagged content grouped by tag", async () => {
    const result = await getAllTaggedContent(testUserId);

    assert.ok(result.success);
    assert.ok(result.data);
    assert.ok(result.data.length >= 3);

    // Check structure
    const productivityTag = result.data.find(
      (group) => group.tag.name === "productivity"
    );
    assert.ok(productivityTag);
    assert.ok(productivityTag.content.length >= 2);
    assert.strictEqual(
      productivityTag.tag.highlightCount,
      productivityTag.content.length
    );
  });

  it("should order tagged content by creation date (newest first)", async () => {
    const result = await getTaggedContentByTag(testUserId, testTag1Id);

    assert.ok(result.success);
    assert.ok(result.data);
    assert.ok(result.data.length >= 2);

    // Check ordering
    for (let i = 0; i < result.data.length - 1; i++) {
      const currentDate = new Date(result.data[i].createdAt);
      const nextDate = new Date(result.data[i + 1].createdAt);
      assert.ok(currentDate >= nextDate);
    }
  });

  it("should handle tag with no highlights", async () => {
    const emptyTag = await createTag(testUserId, "unused-tag");
    assert.ok(emptyTag.success && emptyTag.data);

    const result = await getTaggedContentByTag(testUserId, emptyTag.data.id);

    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.length, 0);
  });

  it("should include all tags associated with each highlight", async () => {
    const result = await getTaggedContentByTag(testUserId, testTag1Id);

    assert.ok(result.success);
    assert.ok(result.data);

    // Find the daily log highlight which has 2 tags
    const dailyLogContent = result.data.find(
      (c) => c.source?.section === "daily-logs"
    );
    assert.ok(dailyLogContent);
    assert.ok(dailyLogContent.tags.length >= 2);
  });

  it("should handle highlights across different content types", async () => {
    // Create a goal with highlight
    const goal = await db.goal.create({
      data: {
        title: "Test Goal",
        yearId: testYear1Id,
      },
    });

    const goalHighlight = await createHighlight(
      "goal",
      goal.id,
      "Goal highlight",
      0,
      14,
      [testTag1Id]
    );

    assert.ok(goalHighlight.success);

    const result = await getTaggedContentByTag(testUserId, testTag1Id);

    assert.ok(result.success);
    assert.ok(result.data);

    const goalContent = result.data.find(
      (c) => c.source?.section === "yearly-goals"
    );
    assert.ok(goalContent);
    assert.strictEqual(goalContent.source?.itemTitle, "Test Goal");
  });

  it("should handle hierarchical content sources (task in goal)", async () => {
    const goal = await db.goal.create({
      data: {
        title: "Parent Goal",
        yearId: testYear1Id,
      },
    });

    const task = await db.task.create({
      data: {
        title: "Child Task",
        goalId: goal.id,
      },
    });

    const taskHighlight = await createHighlight(
      "task",
      task.id,
      "Task highlight",
      0,
      14,
      [testTag2Id]
    );

    assert.ok(taskHighlight.success);

    const result = await getTaggedContentByTag(testUserId, testTag2Id);

    assert.ok(result.success);
    assert.ok(result.data);

    const taskContent = result.data.find((c) => c.text === "Task highlight");
    assert.ok(taskContent);
    assert.ok(taskContent.source?.itemTitle.includes("Parent Goal"));
    assert.ok(taskContent.source?.itemTitle.includes("Child Task"));
  });

  it("should prevent duplicate tag names per user", async () => {
    const result1 = await createTag(testUserId, "duplicate-test");
    assert.ok(result1.success);

    const result2 = await createTag(testUserId, "duplicate-test");
    assert.ok(!result2.success);
  });

  it("should allow same tag name for different users", async () => {
    // Create another user
    const user2 = await db.user.create({
      data: {
        email: `test-tags-2-${Date.now()}@example.com`,
        name: "Test User 2",
      },
    });

    const result = await createTag(user2.id, "productivity");
    assert.ok(result.success);
    assert.ok(result.data);
    assert.strictEqual(result.data.name, "productivity");
    assert.strictEqual(result.data.userId, user2.id);

    // Clean up
    await db.tag.deleteMany({ where: { userId: user2.id } });
    await db.user.delete({ where: { id: user2.id } });
  });
});
