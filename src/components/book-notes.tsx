"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  ChevronDown,
  ChevronRight,
  Plus,
  BookOpen,
  FolderOpen,
  Trash2,
  Menu,
  X,
} from "lucide-react";
import { EditorWithPersistence } from "@/components/editor/editor-with-persistence";

interface BookNotesProps {
  yearId: string;
  year: number;
}

export function BookNotes({ yearId, year }: BookNotesProps) {
  const [genres, setGenres] = useState<GenreWithRelations[]>([]);
  const [expandedGenres, setExpandedGenres] = useState<Set<string>>(new Set());
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());
  const [selectedChapter, setSelectedChapter] = useState<{
    id: string;
    title: string;
    content: any;
    highlights?: any[];
  } | null>(null);
  const [newGenreName, setNewGenreName] = useState("");
  const [newBookTitle, setNewBookTitle] = useState<{ [key: string]: string }>(
    {}
  );
  const [newChapterTitle, setNewChapterTitle] = useState<{
    [key: string]: string;
  }>({});
  // OPTIMIZATION: Track mobile sidebar visibility
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
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

  const handleCreateChapter = async (bookId: string) => {
    const title = newChapterTitle[bookId];
    if (!title?.trim()) return;

    startTransition(async () => {
      const result = await createChapter(bookId, title.trim(), {
        type: "doc",
        content: [],
      });
      if (result.success) {
        setNewChapterTitle({ ...newChapterTitle, [bookId]: "" });
        router.refresh();
      }
    });
  };

  const handleChapterClick = (chapter: any) => {
    setSelectedChapter({
      id: chapter.id,
      title: chapter.title,
      content: chapter.content || { type: "doc", content: [] },
      highlights: chapter.highlights || [],
    });
    // OPTIMIZATION: Hide sidebar on mobile when chapter is selected
    setShowMobileSidebar(false);
  };

  const handleChapterSave = async (content: any) => {
    if (!selectedChapter) return;
    await updateChapter(selectedChapter.id, content);
  };

  const handleDeleteGenre = async (genreId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this genre and all its books and chapters?"
      )
    ) {
      startTransition(async () => {
        await deleteGenre(genreId);
        router.refresh();
      });
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (
      confirm("Are you sure you want to delete this book and all its chapters?")
    ) {
      startTransition(async () => {
        await deleteBook(bookId);
        router.refresh();
      });
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (confirm("Are you sure you want to delete this chapter?")) {
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(null);
      }
      startTransition(async () => {
        await deleteChapter(chapterId);
        router.refresh();
      });
    }
  };

  const toggleGenreExpanded = (genreId: string) => {
    const newExpanded = new Set(expandedGenres);
    if (newExpanded.has(genreId)) {
      newExpanded.delete(genreId);
    } else {
      newExpanded.add(genreId);
    }
    setExpandedGenres(newExpanded);
  };

  const toggleBookExpanded = (bookId: string) => {
    const newExpanded = new Set(expandedBooks);
    if (newExpanded.has(bookId)) {
      newExpanded.delete(bookId);
    } else {
      newExpanded.add(bookId);
    }
    setExpandedBooks(newExpanded);
  };

  return (
    /* OPTIMIZATION: Stack vertically on mobile, horizontal on desktop */
    <div className="h-full flex flex-col md:flex-row relative">
      {/* OPTIMIZATION: Mobile sidebar overlay - slides in from left */}
      <div
        className={`
          md:hidden fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity
          ${showMobileSidebar ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={() => setShowMobileSidebar(false)}
      >
        <div
          className={`
            w-[85%] max-w-sm h-full bg-gray-50 shadow-xl transform transition-transform
            ${showMobileSidebar ? "translate-x-0" : "-translate-x-full"}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-bold text-gray-900">
              Book Notes {year}
            </h2>
            <button
              onClick={() => setShowMobileSidebar(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile sidebar content */}
          <div className="overflow-y-auto h-[calc(100%-64px)] p-3">
            {/* Create New Genre */}
            <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateGenre();
                  }}
                  placeholder="Add genre..."
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  size="sm"
                  onClick={handleCreateGenre}
                  disabled={!newGenreName.trim()}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Genres List (same content as desktop) */}
            {genres.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="text-4xl mb-2">📚</div>
                <p className="text-sm text-gray-600">No genres yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {genres.map((genre) => (
                  <div
                    key={genre.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200"
                  >
                    {/* Genre Header */}
                    <div className="p-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleGenreExpanded(genre.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {expandedGenres.has(genre.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <FolderOpen className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900 text-sm flex-1 truncate">
                          {genre.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {genre.books.length}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGenre(genre.id);
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Expanded Genre Content */}
                      {expandedGenres.has(genre.id) && (
                        <div className="mt-2 ml-6 space-y-2">
                          {/* Add Book Input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newBookTitle[genre.id] || ""}
                              onChange={(e) =>
                                setNewBookTitle({
                                  ...newBookTitle,
                                  [genre.id]: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleCreateBook(genre.id);
                              }}
                              placeholder="Add book..."
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleCreateBook(genre.id)}
                              disabled={!newBookTitle[genre.id]?.trim()}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Books List */}
                          {genre.books.map((book) => (
                            <div
                              key={book.id}
                              className="bg-gray-50 rounded-md p-2 border border-gray-200"
                            >
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleBookExpanded(book.id)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  {expandedBooks.has(book.id) ? (
                                    <ChevronDown className="w-3 h-3" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3" />
                                  )}
                                </button>
                                <BookOpen className="w-3 h-3 text-green-600" />
                                <span className="text-xs font-medium text-gray-900 flex-1 truncate">
                                  {book.title}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {book.chapters.length}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBook(book.id);
                                  }}
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Expanded Book Content */}
                              {expandedBooks.has(book.id) && (
                                <div className="mt-2 ml-5 space-y-1">
                                  {/* Add Chapter Input */}
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={newChapterTitle[book.id] || ""}
                                      onChange={(e) =>
                                        setNewChapterTitle({
                                          ...newChapterTitle,
                                          [book.id]: e.target.value,
                                        })
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                          handleCreateChapter(book.id);
                                      }}
                                      placeholder="Add chapter..."
                                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleCreateChapter(book.id)
                                      }
                                      disabled={
                                        !newChapterTitle[book.id]?.trim()
                                      }
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>

                                  {/* Chapters List */}
                                  {book.chapters.map((chapter) => (
                                    <div
                                      key={chapter.id}
                                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-blue-50 ${
                                        selectedChapter?.id === chapter.id
                                          ? "bg-blue-100 text-blue-900 font-medium"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      <button
                                        onClick={() =>
                                          handleChapterClick(chapter)
                                        }
                                        className="flex-1 text-left truncate"
                                      >
                                        {chapter.title}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteChapter(chapter.id);
                                        }}
                                        className="text-gray-400 hover:text-red-600 shrink-0"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OPTIMIZATION: Desktop sidebar - visible only on md+ */}
      <div className="hidden md:block w-80 flex-shrink-0 border-r border-gray-200 overflow-y-auto bg-gray-50">
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Book Notes {year}
          </h2>

          {/* Create New Genre */}
          <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newGenreName}
                onChange={(e) => setNewGenreName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateGenre();
                }}
                placeholder="Add genre..."
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                size="sm"
                onClick={handleCreateGenre}
                disabled={!newGenreName.trim()}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Genres List (same as mobile content) */}
          {genres.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-4xl mb-2">📚</div>
              <p className="text-sm text-gray-600">No genres yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {genres.map((genre) => (
                <div
                  key={genre.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  {/* Genre Header */}
                  <div className="p-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleGenreExpanded(genre.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {expandedGenres.has(genre.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <FolderOpen className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900 text-sm flex-1 truncate">
                        {genre.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {genre.books.length}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGenre(genre.id);
                        }}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Expanded Genre Content */}
                    {expandedGenres.has(genre.id) && (
                      <div className="mt-2 ml-6 space-y-2">
                        {/* Add Book Input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newBookTitle[genre.id] || ""}
                            onChange={(e) =>
                              setNewBookTitle({
                                ...newBookTitle,
                                [genre.id]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateBook(genre.id);
                            }}
                            placeholder="Add book..."
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleCreateBook(genre.id)}
                            disabled={!newBookTitle[genre.id]?.trim()}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Books List */}
                        {genre.books.map((book) => (
                          <div
                            key={book.id}
                            className="bg-gray-50 rounded-md p-2 border border-gray-200"
                          >
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleBookExpanded(book.id)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {expandedBooks.has(book.id) ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                              </button>
                              <BookOpen className="w-3 h-3 text-green-600" />
                              <span className="text-xs font-medium text-gray-900 flex-1 truncate">
                                {book.title}
                              </span>
                              <span className="text-xs text-gray-500">
                                {book.chapters.length}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBook(book.id);
                                }}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Expanded Book Content */}
                            {expandedBooks.has(book.id) && (
                              <div className="mt-2 ml-5 space-y-1">
                                {/* Add Chapter Input */}
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newChapterTitle[book.id] || ""}
                                    onChange={(e) =>
                                      setNewChapterTitle({
                                        ...newChapterTitle,
                                        [book.id]: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleCreateChapter(book.id);
                                    }}
                                    placeholder="Add chapter..."
                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleCreateChapter(book.id)}
                                    disabled={!newChapterTitle[book.id]?.trim()}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>

                                {/* Chapters List */}
                                {book.chapters.map((chapter) => (
                                  <div
                                    key={chapter.id}
                                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-blue-50 ${
                                      selectedChapter?.id === chapter.id
                                        ? "bg-blue-100 text-blue-900 font-medium"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    <button
                                      onClick={() =>
                                        handleChapterClick(chapter)
                                      }
                                      className="flex-1 text-left truncate"
                                    >
                                      {chapter.title}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteChapter(chapter.id);
                                      }}
                                      className="text-gray-400 hover:text-red-600 shrink-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Chapter Editor */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {selectedChapter ? (
          <div className="h-full flex flex-col">
            {/* OPTIMIZATION: Mobile header with back button */}
            <div className="border-b border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="md:hidden text-gray-600 hover:text-gray-900"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate flex-1">
                  {selectedChapter.title}
                </h3>
              </div>
            </div>
            {/* OPTIMIZATION: Reduced padding on mobile */}
            <div className="flex-1 p-4 sm:p-6">
              <EditorWithPersistence
                key={selectedChapter.id}
                entityType="chapter"
                entityId={selectedChapter.id}
                initialContent={selectedChapter.content}
                highlights={(selectedChapter as any).highlights || []}
                onContentChange={handleChapterSave}
                placeholder="Write your chapter notes here..."
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center">
              {/* OPTIMIZATION: Show menu button when no chapter selected on mobile */}
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="md:hidden mb-4 mx-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Menu className="w-5 h-5" />
                <span>Browse Books</span>
              </button>
              <div className="text-6xl mb-4">📖</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                No Chapter Selected
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Select a chapter to start editing
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
