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

export type UserWithRelations = User & {
  years: Year[];
  tags: Tag[];
};

export type YearWithRelations = Year & {
  dailyLogs: DailyLog[];
  quarterlyReflections: QuarterlyReflection[];
  goals: GoalWithRelations[];
  genres: GenreWithRelations[];
  lessons: Lesson[];
  creativeNotes: CreativeNote[];
};

export type GoalWithRelations = Goal & {
  tasks: TaskWithRelations[];
  highlights: Highlight[];
};

export type TaskWithRelations = Task & {
  subtasks: SubTask[];
  highlights: Highlight[];
};

export type GenreWithRelations = Genre & {
  books: BookWithRelations[];
};

export type BookWithRelations = Book & {
  chapters: Chapter[];
};

export type TiptapContent = {
  type: string;
  content?: TiptapContent[];
  attrs?: Record<string, any>;
  text?: string;
};

export type ContentSource = {
  year: number;
  section: SectionType;
  itemId: string;
  itemTitle: string;
};

export type TaggedContent = {
  id: string;
  text: string;
  source: ContentSource;
  createdAt: Date;
};

export type SectionType =
  | "daily-logs"
  | "quarterly-reflections"
  | "yearly-goals"
  | "book-notes"
  | "lessons-learned"
  | "creative-dump";
