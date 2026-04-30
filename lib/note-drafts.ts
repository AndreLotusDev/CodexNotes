import { TipTapDoc } from "@/lib/types";

export const EMPTY_NOTE_TITLE = "";

export const EMPTY_NOTE_DOC: TipTapDoc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: []
    }
  ]
};

export function hasMeaningfulNoteContent(node: TipTapDoc | undefined): boolean {
  if (!node) {
    return false;
  }

  if (typeof node.text === "string" && node.text.trim().length > 0) {
    return true;
  }

  return Array.isArray(node.content) ? node.content.some(hasMeaningfulNoteContent) : false;
}

export function isEmptyUntitledNote(title: string, contentJson: TipTapDoc): boolean {
  return title.trim().length === 0 && !hasMeaningfulNoteContent(contentJson);
}
