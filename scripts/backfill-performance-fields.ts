#!/usr/bin/env tsx

/**
 * Backfill script to populate performance fields for existing data
 * This script uses the same utility functions as runtime code to ensure consistency
 */

import { PrismaClient } from "@prisma/client";
import {
  extractPreviewText,
  hasSubstantialContent,
  validateContentProcessing,
} from "../src/lib/content-utils";
import { TiptapContent } from "../src/types";

const prisma = new PrismaClient();

interface BackfillStats {
  dailyLogs: { processed: number; updated: number };
  lessons: { processed: number; updated: number };
  creativeNotes: { processed: number; updated: number };
  errors: string[];
}

async function main() {
  console.log("🚀 Starting performance fields backfill...");

  const stats: BackfillStats = {
    dailyLogs: { processed: 0, updated: 0 },
    lessons: { processed: 0, updated: 0 },
    creativeNotes: { processed: 0, updated: 0 },
    errors: [],
  };

  try {
    // Backfill Daily Logs hasContent field
    await backfillDailyLogs(stats);

    // Backfill Lessons preview field
    await backfillLessons(stats);

    // Backfill Creative Notes preview field
    await backfillCreativeNotes(stats);

    // Print final statistics
    printStats(stats);
  } catch (error) {
    console.error("❌ Backfill failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function backfillDailyLogs(stats: BackfillStats) {
  console.log("\n📅 Processing Daily Logs...");

  const dailyLogs = await prisma.dailyLog.findMany({
    select: {
      id: true,
      content: true,
      hasContent: true,
    },
  });

  for (const log of dailyLogs) {
    stats.dailyLogs.processed++;

    try {
      const content = log.content as TiptapContent | null;
      const shouldHaveContent = hasSubstantialContent(content);

      // Only update if the current value is incorrect
      if (log.hasContent !== shouldHaveContent) {
        await prisma.dailyLog.update({
          where: { id: log.id },
          data: { hasContent: shouldHaveContent },
        });

        stats.dailyLogs.updated++;

        if (stats.dailyLogs.updated % 100 === 0) {
          console.log(`  ✅ Updated ${stats.dailyLogs.updated} daily logs...`);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to process daily log ${log.id}: ${error}`;
      stats.errors.push(errorMsg);
      console.warn(`  ⚠️  ${errorMsg}`);
    }
  }

  console.log(
    `✅ Daily Logs: ${stats.dailyLogs.processed} processed, ${stats.dailyLogs.updated} updated`
  );
}

async function backfillLessons(stats: BackfillStats) {
  console.log("\n📚 Processing Lessons...");

  const lessons = await prisma.lesson.findMany({
    select: {
      id: true,
      content: true,
      preview: true,
    },
  });

  for (const lesson of lessons) {
    stats.lessons.processed++;

    try {
      const content = lesson.content as TiptapContent | null;
      const newPreview = extractPreviewText(content);

      // Only update if the preview has changed
      if (lesson.preview !== newPreview) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { preview: newPreview },
        });

        stats.lessons.updated++;

        if (stats.lessons.updated % 100 === 0) {
          console.log(`  ✅ Updated ${stats.lessons.updated} lessons...`);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to process lesson ${lesson.id}: ${error}`;
      stats.errors.push(errorMsg);
      console.warn(`  ⚠️  ${errorMsg}`);
    }
  }

  console.log(
    `✅ Lessons: ${stats.lessons.processed} processed, ${stats.lessons.updated} updated`
  );
}

async function backfillCreativeNotes(stats: BackfillStats) {
  console.log("\n🎨 Processing Creative Notes...");

  const creativeNotes = await prisma.creativeNote.findMany({
    select: {
      id: true,
      content: true,
      preview: true,
    },
  });

  for (const note of creativeNotes) {
    stats.creativeNotes.processed++;

    try {
      const content = note.content as TiptapContent | null;
      const newPreview = extractPreviewText(content);

      // Only update if the preview has changed
      if (note.preview !== newPreview) {
        await prisma.creativeNote.update({
          where: { id: note.id },
          data: { preview: newPreview },
        });

        stats.creativeNotes.updated++;

        if (stats.creativeNotes.updated % 100 === 0) {
          console.log(
            `  ✅ Updated ${stats.creativeNotes.updated} creative notes...`
          );
        }
      }
    } catch (error) {
      const errorMsg = `Failed to process creative note ${note.id}: ${error}`;
      stats.errors.push(errorMsg);
      console.warn(`  ⚠️  ${errorMsg}`);
    }
  }

  console.log(
    `✅ Creative Notes: ${stats.creativeNotes.processed} processed, ${stats.creativeNotes.updated} updated`
  );
}

function printStats(stats: BackfillStats) {
  console.log("\n📊 Backfill Summary:");
  console.log("===================");
  console.log(
    `Daily Logs: ${stats.dailyLogs.updated}/${stats.dailyLogs.processed} updated`
  );
  console.log(
    `Lessons: ${stats.lessons.updated}/${stats.lessons.processed} updated`
  );
  console.log(
    `Creative Notes: ${stats.creativeNotes.updated}/${stats.creativeNotes.processed} updated`
  );

  const totalProcessed =
    stats.dailyLogs.processed +
    stats.lessons.processed +
    stats.creativeNotes.processed;
  const totalUpdated =
    stats.dailyLogs.updated +
    stats.lessons.updated +
    stats.creativeNotes.updated;

  console.log(`\nTotal: ${totalUpdated}/${totalProcessed} records updated`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  ${stats.errors.length} errors occurred:`);
    stats.errors.forEach((error) => console.log(`  - ${error}`));
  } else {
    console.log("\n🎉 Backfill completed successfully with no errors!");
  }
}

// Validation function to test the backfill results
export async function validateBackfillResults(): Promise<boolean> {
  console.log("\n🔍 Validating backfill results...");

  let isValid = true;

  // Sample a few records to validate they were processed correctly
  const sampleDailyLogs = await prisma.dailyLog.findMany({
    take: 10,
    select: { id: true, content: true, hasContent: true },
  });

  for (const log of sampleDailyLogs) {
    const content = log.content as TiptapContent | null;
    const validation = validateContentProcessing(content);

    if (log.hasContent !== validation.hasContent) {
      console.error(`❌ Daily log ${log.id} has incorrect hasContent value`);
      isValid = false;
    }
  }

  const sampleLessons = await prisma.lesson.findMany({
    take: 10,
    select: { id: true, content: true, preview: true },
  });

  for (const lesson of sampleLessons) {
    const content = lesson.content as TiptapContent | null;
    const validation = validateContentProcessing(content);

    if (lesson.preview !== validation.preview) {
      console.error(`❌ Lesson ${lesson.id} has incorrect preview value`);
      isValid = false;
    }
  }

  if (isValid) {
    console.log("✅ Validation passed - backfill results are correct");
  }

  return isValid;
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}
