import { Mark, mergeAttributes } from "@tiptap/core";

export interface HighlightWithTagsOptions {
  multicolor: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    highlightWithTags: {
      setHighlight: (attributes?: {
        tags?: string[];
        id?: string;
      }) => ReturnType;
      toggleHighlight: (attributes?: {
        tags?: string[];
        id?: string;
      }) => ReturnType;
      unsetHighlight: () => ReturnType;
    };
  }
}

export const HighlightWithTags = Mark.create<HighlightWithTagsOptions>({
  name: "highlightWithTags",

  addOptions() {
    return {
      multicolor: true,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      tags: {
        default: [],
        parseHTML: (element) => {
          const tags = element.getAttribute("data-tags");
          return tags ? JSON.parse(tags) : [];
        },
        renderHTML: (attributes) => {
          if (!attributes.tags || attributes.tags.length === 0) {
            return {};
          }
          return {
            "data-tags": JSON.stringify(attributes.tags),
          };
        },
      },
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-highlight-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }
          return {
            "data-highlight-id": attributes.id,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "mark[data-tags]",
      },
      {
        tag: "mark[data-highlight-id]",
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "highlight-with-tags",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setHighlight:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleHighlight:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
