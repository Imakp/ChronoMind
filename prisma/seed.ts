import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test User",
    },
  });

  console.log("✅ Created test user:", user.email);

  // Create a year for the test user
  const currentYear = new Date().getFullYear();
  const year = await prisma.year.upsert({
    where: {
      userId_year: {
        userId: user.id,
        year: currentYear,
      },
    },
    update: {},
    create: {
      year: currentYear,
      userId: user.id,
    },
  });

  console.log("✅ Created year:", year.year);

  // Create some sample tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: "productivity",
        },
      },
      update: {},
      create: {
        name: "productivity",
        userId: user.id,
      },
    }),
    prisma.tag.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: "learning",
        },
      },
      update: {},
      create: {
        name: "learning",
        userId: user.id,
      },
    }),
    prisma.tag.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: "reflection",
        },
      },
      update: {},
      create: {
        name: "reflection",
        userId: user.id,
      },
    }),
  ]);

  console.log("✅ Created tags:", tags.map((tag) => tag.name).join(", "));

  // Create sample daily log
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day

  const dailyLog = await prisma.dailyLog.upsert({
    where: {
      yearId_date: {
        yearId: year.id,
        date: today,
      },
    },
    update: {},
    create: {
      date: today,
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "This is a sample daily log entry. You can write your thoughts and activities here.",
              },
            ],
          },
        ],
      },
      yearId: year.id,
    },
  });

  console.log("✅ Created daily log for:", dailyLog.date.toDateString());

  // Create quarterly reflections
  const quarters = [1, 2, 3, 4];
  for (const quarter of quarters) {
    await prisma.quarterlyReflection.upsert({
      where: {
        yearId_quarter: {
          yearId: year.id,
          quarter: quarter,
        },
      },
      update: {},
      create: {
        quarter: quarter,
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `Q${quarter} reflection placeholder. Reflect on your achievements and learnings this quarter.`,
                },
              ],
            },
          ],
        },
        yearId: year.id,
      },
    });
  }

  console.log("✅ Created quarterly reflections");

  // Create sample goal with tasks and subtasks
  const goal = await prisma.goal.create({
    data: {
      title: "Learn Full-Stack Development",
      description: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Master modern web development technologies and build production-ready applications.",
              },
            ],
          },
        ],
      },
      percentage: 0,
      yearId: year.id,
    },
  });

  const task = await prisma.task.create({
    data: {
      title: "Master React and Next.js",
      description: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Learn React fundamentals and Next.js framework for building modern web applications.",
              },
            ],
          },
        ],
      },
      percentage: 0,
      goalId: goal.id,
    },
  });

  await Promise.all([
    prisma.subTask.create({
      data: {
        title: "Complete React tutorial",
        isComplete: true,
        taskId: task.id,
      },
    }),
    prisma.subTask.create({
      data: {
        title: "Build a Next.js project",
        isComplete: false,
        taskId: task.id,
      },
    }),
    prisma.subTask.create({
      data: {
        title: "Deploy to production",
        isComplete: false,
        taskId: task.id,
      },
    }),
  ]);

  console.log("✅ Created sample goal with tasks and subtasks");

  // Create sample book notes structure
  const genre = await prisma.genre.create({
    data: {
      name: "Technology",
      yearId: year.id,
    },
  });

  const book = await prisma.book.create({
    data: {
      title: "Clean Code",
      genreId: genre.id,
    },
  });

  await prisma.chapter.create({
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
                text: "Notes on writing clean, readable code. Key principles include meaningful names, small functions, and clear intent.",
              },
            ],
          },
        ],
      },
      bookId: book.id,
    },
  });

  console.log("✅ Created sample book notes");

  // Create sample lesson
  await prisma.lesson.create({
    data: {
      title: "The Power of Consistency",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Small, consistent actions compound over time to create significant results. Focus on daily habits rather than sporadic intense efforts.",
              },
            ],
          },
        ],
      },
      yearId: year.id,
    },
  });

  console.log("✅ Created sample lesson");

  // Create sample creative note
  await prisma.creativeNote.create({
    data: {
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Random idea: What if we could visualize our thoughts as a network graph, showing connections between different concepts and ideas over time?",
              },
            ],
          },
        ],
      },
      yearId: year.id,
    },
  });

  console.log("✅ Created sample creative note");

  console.log("🎉 Database seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
