"use client";

import { useState } from "react";
import { RichTextEditor } from "./rich-text-editor";

export function EditorDemo() {
  const [content, setContent] = useState({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Welcome to the ChronoMind rich text editor! Try selecting some text and clicking the Highlight button to add tags.",
          },
        ],
      },
    ],
  });

  const [highlights, setHighlights] = useState<
    Array<{
      text: string;
      tags: string[];
      startOffset: number;
      endOffset: number;
    }>
  >([]);

  const handleHighlight = (highlightData: {
    text: string;
    tags: string[];
    startOffset: number;
    endOffset: number;
  }) => {
    console.log("New highlight created:", highlightData);
    setHighlights([...highlights, highlightData]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Rich Text Editor Demo</h1>
        <p className="text-gray-600">
          Test the highlighting and tagging functionality
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Editor</h2>
        <RichTextEditor
          content={content}
          onChange={setContent}
          onHighlight={handleHighlight}
          placeholder="Start writing your thoughts..."
        />
      </div>

      {highlights.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Highlights</h2>
          <div className="space-y-3">
            {highlights.map((highlight, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <p className="text-sm text-gray-600 mb-2">
                  &quot;{highlight.text}&quot;
                </p>
                <div className="flex flex-wrap gap-2">
                  {highlight.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Offset: {highlight.startOffset} - {highlight.endOffset}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Type or edit text in the editor above</li>
          <li>Select any text you want to highlight</li>
          <li>Click the &quot;Highlight&quot; button in the toolbar</li>
          <li>Add one or more tags in the popup menu</li>
          <li>Click &quot;Save Tags&quot; to apply the highlight</li>
          <li>Your highlights will appear in the list below</li>
        </ol>
      </div>
    </div>
  );
}
