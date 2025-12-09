"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, BookOpen, Trash2, ArrowLeft, Edit2, X } from "lucide-react";
import { EditorWithPersistence } from "@/components/editor/editor-with-persistence";

interface BookNotesProps {
  yearId: string;
  year: number;
}

type ViewMode = "library" | "book" | "chapter";

export function BookNotes({ yearId, year }: BookNotesProps) {
  const [genres, setGenres] = useState<GenreWithRelations[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("library");
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<any | null>(null);
  const [newGenreName, setNewGenreName] = useState("");
  const [newBookTitle, setNewBookTitle] = useState<{ [key: string]: string }>(
    {}
  );
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    loadBookNotes();
  }, [yearId]);

  const loadBookNotes = async () => {
    const result = await getBookNotes(yearId);
    if (result.success && result.data) {
      setGenres(result.data);
    }
  };

  const handleCreateGenre = async () => {
    if (!newGenreName.trim()) return;
    startTransition(async () => {
      const result = await createGenre(yearId, newGenreName.trim());
      if (result.success) {
        setNewGenreName("");
        router.refresh();
      }
    });
  };

  const handleCreateBook = async (genreId: string) => {
    const title = newBookTitle[genreId];
    if (!title?.trim()) return;
    startTransition(async () => {
      const result = await createBook(genreId, title.trim());
      if (result.success) {
        setNewBookTitle({ ...newBookTitle, [genreId]: "" });
        router.refresh();
      }
    });
  };

  const handleCreateChapter = async () => {
    if (!selectedBook || !newChapterTitle.trim()) return;
    startTransition(async () => {
      const result = await createChapter(
        selectedBook.id,
        newChapterTitle.trim(),
        {
          type: "doc",
          content: [],
        }
      );
      if (result.success) {
        setNewChapterTitle("");
        router.refresh();
      }
    });
  };

  const handleOpenBook = (book: any) => {
    setSelectedBook(book);
    setViewMode("book");
  };

  const handleOpenChapter = (chapter: any) => {
    setSelectedChapter({
      id: chapter.id,
      title: chapter.title,
      content: chapter.content || { type: "doc", content: [] },
      highlights: chapter.highlights || [],
    });
    setViewMode("chapter");
  };

  const handleChapterSave = async (content: any) => {
    if (!selectedChapter) return;
    await updateChapter(selectedChapter.id, content);
  };

  const handleDeleteGenre = async (genreId: string) => {
    if (confirm("Delete this genre and all its books?")) {
      startTransition(async () => {
        await deleteGenre(genreId);
        router.refresh();
      });
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (confirm("Delete this book and all its chapters?")) {
      startTransition(async () => {
        await deleteBook(bookId);
        setViewMode("library");
        setSelectedBook(null);
        router.refresh();
      });
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (confirm("Delete this chapter?")) {
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(null);
        setViewMode("book");
      }
      startTransition(async () => {
        await deleteChapter(chapterId);
        router.refresh();
      });
    }
  };

  const getBookColor = (index: number) => {
    const colors = [
      "from-amber-100 to-amber-200 border-amber-300",
      "from-blue-100 to-blue-200 border-blue-300",
      "from-emerald-100 to-emerald-200 border-emerald-300",
      "from-rose-100 to-rose-200 border-rose-300",
      "from-purple-100 to-purple-200 border-purple-300",
      "from-cyan-100 to-cyan-200 border-cyan-300",
    ];
    return colors[index % colors.length];
  };

  // Library View (Visual Bookshelf)
  if (viewMode === "library") {
    return (
      <div className="p-6 h-full overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-serif font-bold text-foreground tracking-tight mb-2">
            Library
          </h2>
          <p className="text-sm text-muted-foreground">
            Organize your reading notes by genre and book
          </p>
        </div>

        {/* Create Genre */}
        <Card className="mb-6 border-border/60">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newGenreName}
                onChange={(e) => setNewGenreName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateGenre()}
                placeholder="Add a new genre..."
                className="flex-1 px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              />
              <Button
                onClick={handleCreateGenre}
                disabled={!newGenreName.trim()}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Genre
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Genres & Books Grid */}
        {genres.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
                No Genres Yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Start by adding your first genre
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {genres.map((genre) => (
              <div key={genre.id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-serif font-medium text-foreground">
                      {genre.name}
                    </h3>
                    <Badge variant="outline" className="font-mono">
                      {genre.books.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDeleteGenre(genre.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Books Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {genre.books.map((book, index) => (
                    <div
                      key={book.id}
                      className="group cursor-pointer"
                      onClick={() => handleOpenBook(book)}
                    >
                      {/* Book Cover */}
                      <div
                        className={`aspect-[2/3] rounded-r-md rounded-l-sm bg-gradient-to-br ${getBookColor(
                          index
                        )} border-l-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex items-center justify-center p-4 text-center relative`}
                      >
                        <span className="font-serif font-bold text-foreground/80 leading-tight text-sm">
                          {book.title}
                        </span>
                      </div>
                      {/* Metadata */}
                      <div className="mt-2">
                        <p className="text-sm font-medium truncate text-foreground">
                          {book.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {book.chapters.length} chapter
                          {book.chapters.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Add Book Card */}
                  <div className="aspect-[2/3] border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors p-4">
                    <input
                      type="text"
                      value={newBookTitle[genre.id] || ""}
                      onChange={(e) =>
                        setNewBookTitle({
                          ...newBookTitle,
                          [genre.id]: e.target.value,
                        })
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateBook(genre.id)
                      }
                      placeholder="Book title..."
                      className="w-full px-2 py-1 text-xs border border-input rounded-md mb-2 text-center focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateBook(genre.id);
                      }}
                      disabled={!newBookTitle[genre.id]?.trim()}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Book View (Chapters List)
  if (viewMode === "book" && selectedBook) {
    return (
      <div className="p-6 h-full overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewMode("library");
              setSelectedBook(null);
            }}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground tracking-tight mb-2">
                {selectedBook.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedBook.chapters.length} chapter
                {selectedBook.chapters.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDeleteBook(selectedBook.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Add Chapter */}
        <Card className="mb-6 border-border/60">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateChapter()}
                placeholder="Add a new chapter..."
                className="flex-1 px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              />
              <Button
                onClick={handleCreateChapter}
                disabled={!newChapterTitle.trim()}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Chapter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chapters List */}
        {selectedBook.chapters.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No chapters yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {selectedBook.chapters.map((chapter: any, index: number) => (
              <Card
                key={chapter.id}
                className="hover-elevate cursor-pointer border-border/60"
                onClick={() => handleOpenChapter(chapter)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-mono text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="font-medium text-foreground">
                        {chapter.title}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChapter(chapter.id);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Chapter View (Editor)
  if (viewMode === "chapter" && selectedChapter) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewMode("book");
              setSelectedChapter(null);
            }}
            className="mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {selectedBook?.title}
          </Button>
          <h3 className="text-lg font-serif font-medium text-foreground">
            {selectedChapter.title}
          </h3>
        </div>
        {/* Editor */}
        <div className="flex-1 p-6 overflow-y-auto">
          <EditorWithPersistence
            key={selectedChapter.id}
            entityType="chapter"
            entityId={selectedChapter.id}
            initialContent={selectedChapter.content}
            highlights={selectedChapter.highlights || []}
            onContentChange={handleChapterSave}
            placeholder="Write your chapter notes here..."
          />
        </div>
      </div>
    );
  }

  return null;
}
