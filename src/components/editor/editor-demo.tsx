"use client";

import { useState } from "react";
import { RichTextEditor } from "./rich-text-editor";
import { TiptapContent } from "@/types";

export function EditorDemo() {
  const [content, setContent] = useState<TiptapContent>({
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
          placeholder="Start writing your thoughts..."
          entityType="demo"
          entityId="demo-id"
          userId="demo-user"
        />
      </div>

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
