-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "Year" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Year_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" JSONB,
    "hasContent" BOOLEAN NOT NULL DEFAULT false,
    "yearId" TEXT NOT NULL,

    CONSTRAINT "DailyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuarterlyReflection" (
    "id" TEXT NOT NULL,
    "quarter" INTEGER NOT NULL,
    "content" JSONB,
    "yearId" TEXT NOT NULL,

    CONSTRAINT "QuarterlyReflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" JSONB,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "yearId" TEXT NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" JSONB,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "goalId" TEXT NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "SubTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB,
    "bookId" TEXT NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB,
    "preview" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "yearId" TEXT NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreativeNote" (
    "id" TEXT NOT NULL,
    "content" JSONB,
    "preview" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "yearId" TEXT NOT NULL,

    CONSTRAINT "CreativeNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Highlight" (
    "id" TEXT NOT NULL,
    "tiptapId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "startOffset" INTEGER NOT NULL,
    "endOffset" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailyLogId" TEXT,
    "quarterlyReflectionId" TEXT,
    "goalId" TEXT,
    "taskId" TEXT,
    "subtaskId" TEXT,
    "chapterId" TEXT,
    "lessonId" TEXT,
    "creativeNoteId" TEXT,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_HighlightToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Year_userId_idx" ON "Year"("userId");

-- CreateIndex
CREATE INDEX "Year_year_idx" ON "Year"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Year_userId_year_key" ON "Year"("userId", "year");

-- CreateIndex
CREATE INDEX "DailyLog_yearId_idx" ON "DailyLog"("yearId");

-- CreateIndex
CREATE INDEX "DailyLog_date_idx" ON "DailyLog"("date");

-- CreateIndex
CREATE INDEX "DailyLog_hasContent_idx" ON "DailyLog"("hasContent");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_yearId_date_key" ON "DailyLog"("yearId", "date");

-- CreateIndex
CREATE INDEX "QuarterlyReflection_yearId_idx" ON "QuarterlyReflection"("yearId");

-- CreateIndex
CREATE UNIQUE INDEX "QuarterlyReflection_yearId_quarter_key" ON "QuarterlyReflection"("yearId", "quarter");

-- CreateIndex
CREATE INDEX "Goal_yearId_idx" ON "Goal"("yearId");

-- CreateIndex
CREATE INDEX "Task_goalId_idx" ON "Task"("goalId");

-- CreateIndex
CREATE INDEX "SubTask_taskId_idx" ON "SubTask"("taskId");

-- CreateIndex
CREATE INDEX "Genre_yearId_idx" ON "Genre"("yearId");

-- CreateIndex
CREATE INDEX "Book_genreId_idx" ON "Book"("genreId");

-- CreateIndex
CREATE INDEX "Chapter_bookId_idx" ON "Chapter"("bookId");

-- CreateIndex
CREATE INDEX "Lesson_yearId_idx" ON "Lesson"("yearId");

-- CreateIndex
CREATE INDEX "Lesson_createdAt_idx" ON "Lesson"("createdAt");

-- CreateIndex
CREATE INDEX "CreativeNote_yearId_idx" ON "CreativeNote"("yearId");

-- CreateIndex
CREATE INDEX "CreativeNote_createdAt_idx" ON "CreativeNote"("createdAt");

-- CreateIndex
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Highlight_tiptapId_key" ON "Highlight"("tiptapId");

-- CreateIndex
CREATE INDEX "Highlight_dailyLogId_idx" ON "Highlight"("dailyLogId");

-- CreateIndex
CREATE INDEX "Highlight_quarterlyReflectionId_idx" ON "Highlight"("quarterlyReflectionId");

-- CreateIndex
CREATE INDEX "Highlight_goalId_idx" ON "Highlight"("goalId");

-- CreateIndex
CREATE INDEX "Highlight_taskId_idx" ON "Highlight"("taskId");

-- CreateIndex
CREATE INDEX "Highlight_subtaskId_idx" ON "Highlight"("subtaskId");

-- CreateIndex
CREATE INDEX "Highlight_chapterId_idx" ON "Highlight"("chapterId");

-- CreateIndex
CREATE INDEX "Highlight_lessonId_idx" ON "Highlight"("lessonId");

-- CreateIndex
CREATE INDEX "Highlight_creativeNoteId_idx" ON "Highlight"("creativeNoteId");

-- CreateIndex
CREATE INDEX "Highlight_createdAt_idx" ON "Highlight"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_HighlightToTag_AB_unique" ON "_HighlightToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_HighlightToTag_B_index" ON "_HighlightToTag"("B");