"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { EditorWithPersistence } from "@/components/editor/editor-with-persistence";

interface BookNotesProps {
  yearId: string;
  year: number;
}

export function BookNotes({ yearId, year }: BookNotesProps) {
  const [genres, setGenres] = useState<GenreWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGenres, setExpandedGenres] = useState<Set<string>>(new Set());
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());
  const [selectedChapter, setSelectedChapter] = useState<{
    id: string;
    title: string;
    content: any;
  } | null>(null);
  const [newGenreName, setNewGenreName] = useState("");
  const [newBookTitle, setNewBookTitle] = useState<{ [key: string]: string }>(
    {}
  );
  const [newChapterTitle, setNewChapterTitle] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    loadBookNotes();
  }, [yearId]);

  const loadBookNotes = async () => {
    setLoading(true);
    const result = await getBookNotes(yearId);
    if (result.success && result.data) {
      setGenres(result.data);
    }
    setLoading(false);
  };

  const handleCreateGenre = async () => {
    if (!newGenreName.trim()) return;

    const result = await createGenre(yearId, newGenreName.trim());
    if (result.success) {
      setNewGenreName("");
      await loadBookNotes();
    }
  };

  const handleCreateBook = async (genreId: string) => {
    const title = newBookTitle[genreId];
    if (!title?.trim()) return;

    const result = await createBook(genreId, title.trim());
    if (result.success) {
      setNewBookTitle({ ...newBookTitle, [genreId]: "" });
      await loadBookNotes();
    }
  };

  const handleCreateChapter = async (bookId: string) => {
    const title = newChapterTitle[bookId];
    if (!title?.trim()) return;

    const result = await createChapter(bookId, title.trim(), {
      type: "doc",
      content: [],
    });
    if (result.success) {
      setNewChapterTitle({ ...newChapterTitle, [bookId]: "" });
      await loadBookNotes();
    }
  };

  const handleChapterClick = (chapter: any) => {
    setSelectedChapter({
      id: chapter.id,
      title: chapter.title,
      content: chapter.content || { type: "doc", content: [] },
    });
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
      await deleteGenre(genreId);
      await loadBookNotes();
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (
      confirm("Are you sure you want to delete this book and all its chapters?")
    ) {
      await deleteBook(bookId);
      await loadBookNotes();
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (confirm("Are you sure you want to delete this chapter?")) {
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(null);
      }
      await deleteChapter(chapterId);
      await loadBookNotes();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading book notes...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Hierarchy Navigation */}
      <div className="w-80 border-r border-gray-200 overflow-y-auto bg-gray-50">
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

          {/* Genres List */}
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
                      <span className="font-medium text-gray-900 text-sm flex-1">
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
                        className="text-gray-400 hover:text-red-600 ml-2"
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
                              <span className="text-xs font-medium text-gray-900 flex-1">
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
                                className="text-gray-400 hover:text-red-600 ml-2"
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
                                      className="flex-1 text-left"
                                    >
                                      {chapter.title}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteChapter(chapter.id);
                                      }}
                                      className="text-gray-400 hover:text-red-600"
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
      <div className="flex-1 overflow-y-auto">
        {selectedChapter ? (
          <div className="h-full flex flex-col">
            <div className="border-b border-gray-200 bg-white px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedChapter.title}
              </h3>
            </div>
            <div className="flex-1 p-6">
              <EditorWithPersistence
                entityType="chapter"
                entityId={selectedChapter.id}
                initialContent={selectedChapter.content}
                onContentChange={handleChapterSave}
                placeholder="Write your chapter notes here..."
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📖</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Chapter Selected
              </h3>
              <p className="text-gray-600">
                Select a chapter from the left to start editing
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
