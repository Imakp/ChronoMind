import {
  User,
  Year,
  DailyLog,
  QuarterlyReflection,
  Goal,
  Task,
  SubTask,
  Genre,
  Book,
  Chapter,
  Lesson,
  CreativeNote,
  Tag,
  Highlight,
} from "@prisma/client";

export type { Chapter };

export type UserWithRelations = User & {
  years: Year[];
  tags: Tag[];
};

export type DailyLogWithRelations = DailyLog & {
  highlights: Highlight[];
};

export type YearWithRelations = Year & {
  dailyLogs: DailyLog[];
  quarterlyReflections: QuarterlyReflection[];
  goals: GoalWithRelations[];
  genres: GenreWithRelations[];
  lessons: Lesson[];
  creativeNotes: CreativeNoteWithRelations[];
};

export type GoalWithRelations = Goal & {
  tasks: TaskWithRelations[];
  highlights: Highlight[];
};

export type SubTaskWithRelations = SubTask & {
  highlights: Highlight[];
};

export type TaskWithRelations = Task & {
  subtasks: SubTaskWithRelations[];
  highlights: Highlight[];
};

export type GenreWithRelations = Genre & {
  books: BookWithRelations[];
};

export type ChapterWithRelations = Chapter & {
  highlights: Highlight[];
};

export type CreativeNoteWithRelations = CreativeNote & {
  highlights: Highlight[];
};

export type LessonWithRelations = Lesson & {
  highlights: Highlight[];
};

export type BookWithRelations = Book & {
  chapters: ChapterWithRelations[];
};

export type TiptapContent = {
  type: string;
  content?: TiptapContent[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attrs?: Record<string, any>;
  text?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  marks?: Array<{ type: string; attrs?: any }>;
};

export type ContentSource = {
  year: number;
  section: SectionType;
  itemId: string;
  itemTitle: string;
};

export type TaggedContent = {
  id: string;
  tiptapId: string;
  text: string;
  source: ContentSource | null;
  createdAt: Date;
  tags: Tag[];
};

export type TagWithCount = {
  id: string;
  name: string;
  highlightCount: number;
};

export type TaggedContentGroup = {
  tag: TagWithCount;
  content: TaggedContent[];
};

export type SectionType =
  | "daily-logs"
  | "quarterly-reflections"
  | "yearly-goals"
  | "book-notes"
  | "lessons-learned"
  | "creative-dump";
