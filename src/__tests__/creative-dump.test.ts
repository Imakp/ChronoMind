import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { db } from "../lib/db";

describe("Creative Dump Database Operations", () => {
  let testUserId: string;
  let testYearId: string;
  let testNoteId: string;

  before(async () => {
    // Create a test user
    const user = await db.user.create({
      data: {
        email: `test-creative-${Date.now()}@example.com`,
        name: "Test User",
      },
    });
    testUserId = user.id;

    // Create a test year
    const year = await db.year.create({
      data: {
        year: 2025,
        userId: testUserId,
      },
    });
    testYearId = year.id;
  });

  after(async () => {
    // Clean up test data - delete in correct order
    if (testYearId) {
      // Delete all creative notes first
      await db.creativeNote.deleteMany({
        where: { yearId: testYearId },
      });
      // Delete the year
      await db.year.delete({
        where: { id: testYearId },
      });
    }
    if (testUserId) {
      await db.user.delete({
        where: { id: testUserId },
      });
    }
  });

  it("should create a creative note directly via Prisma", async () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "My creative idea" }],
        },
      ],
    };

    const note = await db.creativeNote.create({
      data: {
        content: content as any,
        yearId: testYearId,
      },
    });

    assert.ok(note);
    assert.strictEqual(note.yearId, testYearId);
    assert.deepStrictEqual(note.content, content);

    testNoteId = note.id;
  });

  it("should get creative notes for a year", async () => {
    const notes = await db.creativeNote.findMany({
      where: { yearId: testYearId },
      orderBy: { createdAt: "desc" },
      include: {
        highlights: {
          include: {
            tags: true,
          },
        },
      },
    });

    assert.ok(notes);
    assert.ok(Array.isArray(notes));
    assert.ok(notes.length > 0);
    assert.strictEqual(notes[0].yearId, testYearId);
  });

  it("should update a creative note", async () => {
    const updatedContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Updated creative idea" }],
        },
      ],
    };

    const note = await db.creativeNote.update({
      where: { id: testNoteId },
      data: { content: updatedContent as any },
    });

    assert.ok(note);
    assert.deepStrictEqual(note.content, updatedContent);
  });

  it("should delete a creative note", async () => {
    await db.creativeNote.delete({
      where: { id: testNoteId },
    });

    // Verify it's deleted
    const notes = await db.creativeNote.findMany({
      where: { yearId: testYearId },
    });
    const deletedNote = notes.find((note) => note.id === testNoteId);
    assert.strictEqual(deletedNote, undefined);
  });

  it("should create multiple creative notes", async () => {
    const note1 = await db.creativeNote.create({
      data: {
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "First idea" }],
            },
          ],
        } as any,
        yearId: testYearId,
      },
    });

    const note2 = await db.creativeNote.create({
      data: {
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Second idea" }],
            },
          ],
        } as any,
        yearId: testYearId,
      },
    });

    assert.ok(note1);
    assert.ok(note2);

    const notes = await db.creativeNote.findMany({
      where: { yearId: testYearId },
    });
    assert.ok(notes.length >= 2);
  });

  it("should order creative notes by creation date (newest first)", async () => {
    const notes = await db.creativeNote.findMany({
      where: { yearId: testYearId },
      orderBy: { createdAt: "desc" },
    });

    assert.ok(notes);
    assert.ok(notes.length >= 2);

    // Check that notes are ordered by createdAt descending
    for (let i = 0; i < notes.length - 1; i++) {
      const currentDate = new Date(notes[i].createdAt);
      const nextDate = new Date(notes[i + 1].createdAt);
      assert.ok(currentDate >= nextDate);
    }
  });

  it("should handle empty content", async () => {
    const note = await db.creativeNote.create({
      data: {
        content: { type: "doc", content: [] } as any,
        yearId: testYearId,
      },
    });

    assert.ok(note);
    assert.deepStrictEqual(note.content, { type: "doc", content: [] });
  });

  it("should include highlights relation when fetching notes", async () => {
    const notes = await db.creativeNote.findMany({
      where: { yearId: testYearId },
      include: {
        highlights: {
          include: {
            tags: true,
          },
        },
      },
    });

    assert.ok(notes);
    assert.ok(notes.length > 0);
    // Check that highlights property exists (even if empty)
    assert.ok("highlights" in notes[0]);
  });
});
