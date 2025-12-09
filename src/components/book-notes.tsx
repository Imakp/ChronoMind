"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  createGenre,
  createBook,
  createChapter,
  updateChapter,
  getBookNotes,
  deleteGenre,
  deleteBook,
  deleteChapter,
} from "@/lib/actions";
import type { GenreWithRelations } from "@/types";
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
} from "lucide-react";
import { EditorWithPersistence } from "@/components/editor/editor-with-persistence";
import { cn } from "@/lib/utils";

interface BookNotesProps {
  yearId: string;
  year: number;
}

// Helper to generate consistent colors for book covers based on string
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

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export function BookNotes({ yearId, year }: BookNotesProps) {
  // Navigation State
  const [view, setView] = useState<"genres" | "books" | "chapters" | "editor">(
    "genres"
  );
  const [activeGenre, setActiveGenre] = useState<GenreWithRelations | null>(
    null
  );
  const [activeBook, setActiveBook] = useState<any | null>(null);
  const [activeChapter, setActiveChapter] = useState<any | null>(null);

  // Data State
  const [genres, setGenres] = useState<GenreWithRelations[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Load Data
  useEffect(() => {
    loadBookNotes();
  }, [yearId]);

  const loadBookNotes = async () => {
    const result = await getBookNotes(yearId);
    if (result.success && result.data) {
      setGenres(result.data);
      // Refresh active objects if data updates
      if (activeGenre) {
        const updatedGenre = result.data.find((g) => g.id === activeGenre.id);
        setActiveGenre(updatedGenre || null);
        if (updatedGenre && activeBook) {
          const updatedBook = updatedGenre.books.find(
            (b) => b.id === activeBook.id
          );
          setActiveBook(updatedBook || null);
          if (updatedBook && activeChapter) {
            const updatedChapter = updatedBook.chapters.find(
              (c) => c.id === activeChapter.id
            );
            setActiveChapter(updatedChapter || null);
          }
        }
      }
    }
  };

  // --- Handlers ---
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
        loadBookNotes();
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

      loadBookNotes();
      router.refresh();

      // If deleting the current view's parent, go back
      if (type === "chapter" && activeChapter?.id === id) {
        setView("chapters");
        setActiveChapter(null);
      }
    });
  };

  const handleChapterSave = async (content: any) => {
    if (!activeChapter) return;
    await updateChapter(activeChapter.id, content);
  };

  // --- Breadcrumb Component ---
  const Breadcrumbs = () => (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 overflow-x-auto pb-1">
      <button
        onClick={() => {
          setView("genres");
          setActiveGenre(null);
          setActiveBook(null);
        }}
        className="hover:text-foreground transition-colors font-medium whitespace-nowrap"
      >
        Library
      </button>
      {activeGenre && (
        <>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <button
            onClick={() => {
              setView("books");
              setActiveBook(null);
            }}
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
            onClick={() => {
              setView("chapters");
              setActiveChapter(null);
            }}
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

  // --- Render Views ---
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
            <Plus className="w-4 h-4 mr-2" />
            Add Genre
          </Button>
        </div>

        {isAdding && (
          <div className="bg-card border border-border p-4 rounded-lg flex gap-2 animate-in fade-in slide-in-from-top-2">
            <Input
              placeholder="Genre Name (e.g. Science Fiction)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <Button
              onClick={handleCreate}
              disabled={isPending || !newItemName.trim()}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
              onClick={() => {
                setActiveGenre(genre);
                setView("books");
              }}
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
                      {genre.books.length}{" "}
                      {genre.books.length === 1 ? "Book" : "Books"}
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
            <Plus className="w-4 h-4 mr-2" />
            Add Book
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
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        )}

        {activeGenre.books.length === 0 && !isAdding ? (
          <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-xl bg-secondary/5">
            <Book className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No books in this genre yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {activeGenre.books.map((book) => {
              const coverStyle = getBookColor(book.id);
              return (
                <div
                  key={book.id}
                  className="group cursor-pointer flex flex-col gap-3"
                  onClick={() => {
                    setActiveBook(book);
                    setView("chapters");
                  }}
                >
                  {/* Book Cover */}
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
                    {/* Delete Button (Hover) */}
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
                  {/* Book Meta */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate leading-tight group-hover:text-primary transition-colors">
                      {book.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileText className="w-3 h-3" />
                      <span>{book.chapters.length} Chapters</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 3. CHAPTERS VIEW
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
            <Plus className="w-4 h-4 mr-2" />
            Add Chapter
          </Button>
        </div>

        {isAdding && (
          <div className="bg-card border border-border p-4 rounded-lg flex gap-2 animate-in fade-in slide-in-from-top-2">
            <Input
              placeholder="Chapter Title (e.g. Chapter 1: The Beginning)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <Button
              onClick={handleCreate}
              disabled={isPending || !newItemName.trim()}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
          {activeBook.chapters.map((chapter: any, index: number) => (
            <Card
              key={chapter.id}
              className="hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => {
                setActiveChapter({
                  id: chapter.id,
                  title: chapter.title,
                  content: chapter.content || { type: "doc", content: [] },
                  highlights: chapter.highlights || [],
                });
                setView("editor");
              }}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-muted-foreground/50 text-sm w-6 font-medium">
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {chapter.title}
                  </span>
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

  // 4. EDITOR VIEW
  if (view === "editor" && activeChapter) {
    return (
      <div className="h-full flex flex-col animate-in fade-in duration-300">
        <div className="mb-4">
          <Breadcrumbs />
        </div>
        {/* Editor Wrapper */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden h-[calc(100vh-200px)]">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-secondary/10">
            <div>
              <h2 className="font-serif text-2xl font-medium text-foreground">
                {activeChapter.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeBook.title}
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Auto-saving
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-3xl mx-auto">
              <EditorWithPersistence
                key={activeChapter.id}
                entityType="chapter"
                entityId={activeChapter.id}
                initialContent={activeChapter.content}
                highlights={activeChapter.highlights || []}
                onContentChange={handleChapterSave}
                placeholder="Write your chapter notes, quotes, and thoughts here..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
