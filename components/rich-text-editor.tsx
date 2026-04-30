"use client";

import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  type LucideIcon
} from "lucide-react";
import { TipTapDoc } from "@/lib/types";
import { Button } from "@/components/ui";

type Props = {
  content: TipTapDoc;
  placeholder?: string;
  onChange: (content: TipTapDoc, html: string) => void;
};

export function RichTextEditor({ content, onChange, placeholder = "Start writing..." }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https"
      }),
      Placeholder.configure({
        placeholder: placeholder
      })
    ],
    content: content as JSONContent,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getJSON() as TipTapDoc, currentEditor.getHTML());
    }
  });

  if (!editor) {
    return (
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-5 text-sm text-[var(--foreground-muted)]">
        Loading editor...
      </div>
    );
  }

  const currentEditor = editor;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ToolbarButton
          active={currentEditor.isActive("bold")}
          icon={Bold}
          label="Bold"
          onClick={handleToggleBold}
        />
        <ToolbarButton
          active={currentEditor.isActive("italic")}
          icon={Italic}
          label="Italic"
          onClick={handleToggleItalic}
        />
        <ToolbarButton
          active={currentEditor.isActive("underline")}
          icon={UnderlineIcon}
          label="Underline"
          onClick={handleToggleUnderline}
        />
        <ToolbarButton
          active={currentEditor.isActive("strike")}
          icon={Strikethrough}
          label="Strike"
          onClick={handleToggleStrike}
        />
        <ToolbarButton
          active={currentEditor.isActive("heading", { level: 1 })}
          icon={Heading1}
          label="H1"
          onClick={handleToggleHeadingOne}
        />
        <ToolbarButton
          active={currentEditor.isActive("heading", { level: 2 })}
          icon={Heading2}
          label="H2"
          onClick={handleToggleHeadingTwo}
        />
        <ToolbarButton
          active={currentEditor.isActive("bulletList")}
          icon={List}
          label="Bullets"
          onClick={handleToggleBulletList}
        />
        <ToolbarButton
          active={currentEditor.isActive("orderedList")}
          icon={ListOrdered}
          label="Numbers"
          onClick={handleToggleOrderedList}
        />
        <ToolbarButton
          active={currentEditor.isActive("blockquote")}
          icon={Quote}
          label="Quote"
          onClick={handleToggleBlockquote}
        />
        <ToolbarButton
          active={currentEditor.isActive("codeBlock")}
          icon={Code2}
          label="Code"
          onClick={handleToggleCodeBlock}
        />
        <ToolbarButton active={currentEditor.isActive("link")} icon={Link2} label="Link" onClick={handleInsertLink} />
        <ToolbarButton icon={Undo2} label="Undo" onClick={handleUndo} />
        <ToolbarButton icon={Redo2} label="Redo" onClick={handleRedo} />
      </div>

      <div className="tiptap-editor rounded-[28px] border border-[var(--border)] bg-[var(--surface-muted)]">
        <EditorContent editor={currentEditor} />
      </div>
    </div>
  );

  function handleToggleBold() {
    currentEditor.chain().focus().toggleBold().run();
  }

  function handleToggleItalic() {
    currentEditor.chain().focus().toggleItalic().run();
  }

  function handleToggleUnderline() {
    currentEditor.chain().focus().toggleUnderline().run();
  }

  function handleToggleStrike() {
    currentEditor.chain().focus().toggleStrike().run();
  }

  function handleToggleHeadingOne() {
    currentEditor.chain().focus().toggleHeading({ level: 1 }).run();
  }

  function handleToggleHeadingTwo() {
    currentEditor.chain().focus().toggleHeading({ level: 2 }).run();
  }

  function handleToggleBulletList() {
    currentEditor.chain().focus().toggleBulletList().run();
  }

  function handleToggleOrderedList() {
    currentEditor.chain().focus().toggleOrderedList().run();
  }

  function handleToggleBlockquote() {
    currentEditor.chain().focus().toggleBlockquote().run();
  }

  function handleToggleCodeBlock() {
    currentEditor.chain().focus().toggleCodeBlock().run();
  }

  function handleInsertLink() {
    handleLink(currentEditor);
  }

  function handleUndo() {
    currentEditor.chain().focus().undo().run();
  }

  function handleRedo() {
    currentEditor.chain().focus().redo().run();
  }
}

function ToolbarButton({
  active = false,
  icon: Icon,
  label,
  onClick
}: {
  active?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="group relative">
      <Button
        type="button"
        tone="ghost"
        aria-label={label}
        className={active ? "size-11 border border-[var(--acc-2)] px-0 text-[var(--acc-3)]" : "size-11 px-0"}
        onClick={onClick}
      >
        <Icon size={18} aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </Button>
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 rounded-full bg-[var(--foreground)] px-3 py-1 text-xs font-medium whitespace-nowrap text-[var(--surface)] opacity-0 shadow-[var(--shadow)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {label}
      </span>
    </div>
  );
}

function handleLink(editor: NonNullable<ReturnType<typeof useEditor>>) {
  const previousUrl = editor.getAttributes("link").href as string | undefined;
  const href = window.prompt("Enter a URL", previousUrl ?? "https://");

  if (href === null) {
    return;
  }

  const nextHref = href.trim();
  if (!nextHref) {
    editor.chain().focus().unsetLink().run();
    return;
  }

  editor.chain().focus().extendMarkRange("link").setLink({ href: nextHref }).run();
}
