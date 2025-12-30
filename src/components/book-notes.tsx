// src/components/book-notes.tsx
"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  createGenre,
  createBook,
  createChapter,
  updateChapter,
  deleteGenre,
  deleteBook,
  deleteChapter,
  getBookDetails,
  getChapterDetail,
} from "@/lib/actions";
import type {
  TiptapContent,
  LibraryMetadata,
  BookWithChapters,
  ChapterWithContent,
  BookMetadata,
} from "@/types";
import {
  Plus,
  Book,
  Trash2,
  ChevronRight,
  Library,
  FileText,
  BookOpen,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { EditorWithPersistence } from "@/components/editor/editor-with-persistence";
import { cn } from "@/lib/utils";

interface BookNotesProps {
  yearId: string;
  year: number;
  initialData?: LibraryMetadata;
}

// Helper to generate consistent colors for book covers
const getBookColor = (id: string) => {
  const colors = [
    "bg-amber-100 border-amber-200 text-amber-900",
    "bg-blue-100 border-blue-200 text-blue-900",
    "bg-emerald-100 border-emerald-200 text-emerald-900",
    "bg-rose-100 border-rose-200 text-rose-900",
    "bg-purple-100 border-purple-200 text-purple-900",
    "bg-cyan-100 border-cyan-200 text-cyan-900",
    "bg-indigo-100 border-indigo-200 text-indigo-900",
    "bg-orange-100 border-orange-200 text-orange-900",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export function BookNotes({ yearId, initialData }: BookNotesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- 1. URL-Based State Management ---
  const activeGenreId = searchParams.get("genreId") || null;
  const activeBookId = searchParams.get("bookId") || null;
  const activeChapterId = searchParams.get("chapterId") || null;

  // Helper to update URL params
  const updateUrl = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) newParams.delete(key);
        else newParams.set(key, value);
      });
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // --- 2. Data & UI State ---
  const [genres, setGenres] = useState<LibraryMetadata>(initialData || []);

  // Active Data Containers
  const [activeBookData, setActiveBookData] = useState<BookWithChapters | null>(
    null
  );
  const [activeChapterData, setActiveChapterData] =
    useState<ChapterWithContent | null>(null);

  // Loading States
  const [loadingBookDetails, setLoadingBookDetails] = useState(false);
  const [loadingChapterDetail, setLoadingChapterDetail] = useState(false);
  const [isPending, startTransition] = useTransition();

  // UI States (Creation)
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  // Zen Mode / Editor States (Ported from DailyLogs)
  const [isFocused, setIsFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // --- 3. Data Fetching Effects ---

  // Sync initialData if server revalidates
  useEffect(() => {
    if (initialData) setGenres(initialData);
  }, [initialData]);

  // Fetch Book Details when URL bookId changes
  useEffect(() => {
    if (
      activeBookId &&
      (!activeBookData || activeBookData.id !== activeBookId)
    ) {
      setLoadingBookDetails(true);
      getBookDetails(activeBookId)
        .then((res) => {
          if (res.success && res.data) {
            setActiveBookData(res.data as BookWithChapters);
          }
        })
        .finally(() => setLoadingBookDetails(false));
    } else if (!activeBookId) {
      setActiveBookData(null);
    }
  }, [activeBookId, activeBookData]);

  // Fetch Chapter Details when URL chapterId changes
  useEffect(() => {
    if (
      activeChapterId &&
      (!activeChapterData || activeChapterData.id !== activeChapterId)
    ) {
      setLoadingChapterDetail(true);
      getChapterDetail(activeChapterId)
        .then((res) => {
          if (res.success && res.data) {
            setActiveChapterData(res.data);
          }
        })
        .finally(() => setLoadingChapterDetail(false));
    } else if (!activeChapterId) {
      setActiveChapterData(null);
      setIsFocused(false); // Reset focus when leaving chapter
    }
  }, [activeChapterId, activeChapterData]);

  // Derived Active Objects
  const activeGenre = activeGenreId
    ? genres.find((g) => g.id === activeGenreId)
    : null;
  const activeBook = activeBookData;
  const activeChapter = activeChapterData;

  // Determine current view based on URL presence
  let view: "genres" | "books" | "chapters" | "editor" = "genres";
  if (activeGenreId) view = "books";
  if (activeBookId) view = "chapters";
  if (activeChapterId) view = "editor";

  // --- 4. Handlers ---

  const handleCreate = () => {
    if (!newItemName.trim()) return;
    startTransition(async () => {
      let success = false;
      if (view === "genres") {
        const res = await createGenre(yearId, newItemName.trim());
        success = res.success;
      } else if (view === "books" && activeGenre) {
        const res = await createBook(activeGenre.id, newItemName.trim());
        success = res.success;
      } else if (view === "chapters" && activeBook) {
        const res = await createChapter(activeBook.id, newItemName.trim(), {
          type: "doc",
          content: [],
        });
        success = res.success;
      }

      if (success) {
        setNewItemName("");
        setIsAdding(false);
        router.refresh();
      }
    });
  };

  const handleDelete = async (
    id: string,
    type: "genre" | "book" | "chapter"
  ) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    startTransition(async () => {
      if (type === "genre") await deleteGenre(id);
      if (type === "book") await deleteBook(id);
      if (type === "chapter") await deleteChapter(id);

      router.refresh();

      // Navigate back if deleting current parent
      if (type === "chapter" && activeChapterId === id)
        updateUrl({ chapterId: null });
      if (type === "book" && activeBookId === id)
        updateUrl({ bookId: null, chapterId: null });
    });
  };

  // Optimistic Auto-Save (Matches DailyLogs implementation)
  const handleContentChange = useCallback(
    (content: TiptapContent) => {
      if (!activeChapter) return;

      // Optimistic update
      setActiveChapterData((prev) => (prev ? { ...prev, content } : null));

      if (saveTimeout) clearTimeout(saveTimeout);

      const timeout = setTimeout(async () => {
        setIsSaving(true);
        // Note: updateChapter calls revalidatePath on server, which might refresh data.
        // Because we store state in URL, we stay on the page.
        // Because we hold local state (activeChapterData), we don't flicker.
        await updateChapter(activeChapter.id, content);
        setIsSaving(false);
      }, 1000);

      setSaveTimeout(timeout);
    },
    [activeChapter, saveTimeout]
  );

  // --- 5. Breadcrumbs Component ---
  const Breadcrumbs = () => (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground overflow-x-auto">
      <button
        onClick={() =>
          updateUrl({ genreId: null, bookId: null, chapterId: null })
        }
        className="hover:text-foreground transition-colors font-medium whitespace-nowrap"
      >
        Library
      </button>
      {activeGenre && (
        <>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <button
            onClick={() => updateUrl({ bookId: null, chapterId: null })}
            className={cn(
              "hover:text-foreground transition-colors whitespace-nowrap",
              view === "books" && "font-semibold text-foreground"
            )}
          >
            {activeGenre.name}
          </button>
        </>
      )}
      {activeBook && (
        <>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <button
            onClick={() => updateUrl({ chapterId: null })}
            className={cn(
              "hover:text-foreground transition-colors whitespace-nowrap",
              view === "chapters" && "font-semibold text-foreground"
            )}
          >
            {activeBook.title}
          </button>
        </>
      )}
      {activeChapter && (
        <>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="font-semibold text-foreground truncate max-w-[150px]">
            {activeChapter.title}
          </span>
        </>
      )}
    </nav>
  );

  // --- RENDER VIEWS ---

  // 1. GENRES VIEW
  if (view === "genres") {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-medium text-foreground tracking-tight">
              Library
            </h2>
            <p className="text-muted-foreground mt-1">
              Organize your reading by genre.
            </p>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Genre
          </Button>
        </div>

        {isAdding && (
          <div className="bg-card border border-border p-4 rounded-lg flex gap-2 animate-in fade-in slide-in-from-top-2">
            <Input
              placeholder="Genre Name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <Button
              onClick={handleCreate}
              disabled={isPending || !newItemName.trim()}
            >
              Create
            </Button>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {genres.length === 0 && !isAdding && (
            <div className="col-span-full text-center py-16 border-2 border-dashed border-border/50 rounded-xl">
              <Library className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Your library is empty. Add a genre to start.
              </p>
            </div>
          )}
          {genres.map((genre) => (
            <Card
              key={genre.id}
              className="cursor-pointer hover:shadow-md transition-all group border-l-4 border-l-primary/10 hover:border-l-primary"
              onClick={() => updateUrl({ genreId: genre.id })}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Library className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-medium">
                      {genre.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {genre.books.length} Books
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(genre.id, "genre");
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 2. BOOKS VIEW
  if (view === "books" && activeGenre) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <Breadcrumbs />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-serif text-3xl font-medium">
            {activeGenre.name}
          </h2>
          <Button
            onClick={() => setIsAdding(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Book
          </Button>
        </div>

        {isAdding && (
          <div className="bg-card border border-border p-4 rounded-lg flex gap-2 animate-in fade-in slide-in-from-top-2">
            <Input
              placeholder="Book Title"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <Button
              onClick={handleCreate}
              disabled={isPending || !newItemName.trim()}
            >
              Create
            </Button>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        )}

        <div
          className={cn(
            "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6",
            loadingBookDetails && "opacity-50 pointer-events-none"
          )}
        >
          {activeGenre.books.length === 0 && !isAdding && (
            <p className="col-span-full text-center text-muted-foreground py-10">
              No books yet.
            </p>
          )}
          {activeGenre.books.map((book) => {
            const coverStyle = getBookColor(book.id);
            return (
              <div
                key={book.id}
                className="group cursor-pointer flex flex-col gap-3"
                onClick={() =>
                  updateUrl({ genreId: activeGenre.id, bookId: book.id })
                }
              >
                <div
                  className={cn(
                    "aspect-[2/3] rounded-r-md rounded-l-sm border-l-4 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all flex items-center justify-center p-4 text-center relative overflow-hidden",
                    coverStyle
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-white/20 pointer-events-none" />
                  <span className="font-serif font-bold text-sm sm:text-base leading-tight relative z-10 line-clamp-4">
                    {book.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(book.id, "book");
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/50 hover:bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {book.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="w-3 h-3" />
                    <span>{book._count.chapters} Chapters</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. CHAPTERS VIEW (List of Chapters)
  if (view === "chapters" && activeBook) {
    const coverStyle = getBookColor(activeBook.id);
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <Breadcrumbs />

        {/* Book Header Card */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row items-start gap-6 shadow-sm">
          <div
            className={cn(
              "w-20 h-28 shrink-0 rounded border-l-4 shadow-sm flex items-center justify-center p-2 text-center text-[10px] font-bold leading-tight",
              coverStyle
            )}
          >
            {activeBook.title}
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-3xl font-medium mb-2">
              {activeBook.title}
            </h2>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <span className="bg-secondary px-2 py-0.5 rounded text-xs font-mono">
                {activeGenre?.name}
              </span>
              <span>•</span>
              <span>{activeBook.chapters.length} Chapters</span>
            </p>
          </div>
          <Button onClick={() => setIsAdding(true)} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" /> Add Chapter
          </Button>
        </div>

        {isAdding && (
          <div className="bg-card border border-border p-4 rounded-lg flex gap-2 animate-in fade-in slide-in-from-top-2">
            <Input
              placeholder="Chapter Title"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <Button
              onClick={handleCreate}
              disabled={isPending || !newItemName.trim()}
            >
              Create
            </Button>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {activeBook.chapters.length === 0 && !isAdding && (
            <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-lg bg-secondary/5">
              <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                Start adding chapters to take notes.
              </p>
            </div>
          )}
          {activeBook.chapters.map((chapter, index) => (
            <Card
              key={chapter.id}
              className={cn(
                "hover:border-primary/50 transition-all cursor-pointer group",
                loadingChapterDetail && "opacity-50 pointer-events-none"
              )}
              onClick={() =>
                updateUrl({
                  genreId: activeGenre?.id || null,
                  bookId: activeBook.id,
                  chapterId: chapter.id,
                })
              }
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-muted-foreground/50 text-sm w-6 font-medium">
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {chapter.title}
                  </span>
                  {chapter._count.highlights > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {chapter._count.highlights} highlights
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(chapter.id, "chapter");
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 4. EDITOR VIEW (Zen Mode Implementation)
  if (view === "editor") {
    return (
      <div className="max-w-4xl mx-auto pb-20">
        {/* Header & Breadcrumbs (Blurred when focused) */}
        <div
          className={cn(
            "transition-all duration-700 space-y-4 mb-8",
            isFocused
              ? "opacity-10 blur-[2px] pointer-events-none grayscale"
              : "opacity-100"
          )}
        >
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => updateUrl({ chapterId: null })}
              className="h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Breadcrumbs />
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-4xl font-medium text-foreground">
                {activeChapter?.title || "Loading..."}
              </h1>
              <p className="text-muted-foreground mt-2">{activeBook?.title}</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative group perspective-1000">
          {/* Focus Dimmer Overlay */}
          {isFocused && (
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-[2px] z-10 animate-in fade-in duration-700"
              onClick={() => setIsFocused(false)}
            />
          )}

          {loadingChapterDetail && !activeChapter ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeChapter ? (
            <div
              className={cn(
                "transition-all duration-700 ease-out origin-center relative",
                isFocused
                  ? "scale-[1.02] bg-background z-20 min-h-[70vh] py-12"
                  : "scale-100",
                !isFocused &&
                  "hover:bg-secondary/5 rounded-xl border border-transparent hover:border-border/40 p-4 -mx-4"
              )}
              onFocus={() => !isFocused && setIsFocused(true)}
            >
              {/* Saving Indicator */}
              <div
                className={cn(
                  "flex items-center gap-2 text-xs text-muted-foreground transition-all duration-500 absolute top-0 right-0 p-4",
                  isFocused
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                )}
              >
                {isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                  </span>
                ) : (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    Saved
                  </span>
                )}
              </div>

              <div className="max-w-3xl mx-auto px-4 md:px-0">
                {/* Title in Zen Mode */}
                <div
                  className={cn(
                    "mb-8 text-center transition-all duration-700 delay-100",
                    isFocused
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 -translate-y-4 hidden"
                  )}
                >
                  <p className="font-serif text-2xl text-foreground/80">
                    {activeChapter.title}
                  </p>
                </div>

                <EditorWithPersistence
                  key={activeChapter.id}
                  entityType="chapter"
                  entityId={activeChapter.id}
                  initialContent={
                    (activeChapter.content as TiptapContent) || undefined
                  }
                  highlights={activeChapter.highlights || []}
                  onContentChange={handleContentChange}
                  placeholder="Write your chapter notes, quotes, and thoughts here..."
                  variant="minimal"
                  className="prose-base md:prose-lg"
                />
              </div>
            </div>
          ) : null}

          {/* Floating Done Button */}
          {isFocused && (
            <div className="fixed bottom-8 right-8 animate-in fade-in slide-in-from-bottom-4 duration-500 z-50">
              <Button
                className="shadow-lg rounded-full px-6 h-12"
                onClick={() => setIsFocused(false)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Done Writing
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
