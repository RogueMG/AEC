import { useEffect, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading3, Italic, List, Pilcrow } from "lucide-react";
import { cn } from "@/lib/utils";

// Offers exactly the formatting the server keeps (server/sanitize.ts): paragraphs, h3 headings,
// bullet lists, bold and italic.
const extensions = [
  StarterKit.configure({
    heading: { levels: [3] },
    blockquote: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    underline: false,
    link: false,
    orderedList: false,
  }),
];

type Props = { id: string; describedBy?: string; value: string; onChange: (html: string) => void };

export default function RichTextEditor({ id, describedBy, value, onChange }: Props) {
  const editor = useEditor({
    extensions,
    content: value,
    immediatelyRender: true,
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        class: "rich-text min-h-48 px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Loading a different product replaces the content. In the production build React can re-run this
  // effect (when a loading boundary re-shows the form) after Tiptap has destroyed the old editor and
  // before it makes a new one; reading a destroyed editor throws, so wait for the new one.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (value !== (editor.isEmpty ? "" : editor.getHTML())) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive("bold") ?? false,
      italic: e?.isActive("italic") ?? false,
      heading: e?.isActive("heading", { level: 3 }) ?? false,
      list: e?.isActive("bulletList") ?? false,
      paragraph: e?.isActive("paragraph") ?? false,
    }),
  });

  const tool = (label: string, active: boolean, run: () => void, icon: ReactNode) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn("grid size-9 place-items-center [&_svg]:size-4", active ? "bg-ink text-surface" : "hover:bg-paper")}
    >
      {icon}
    </button>
  );

  return (
    <div className="border border-line bg-surface focus-within:border-teal">
      <div role="toolbar" aria-label="Formatting" className="flex gap-1 border-b border-line p-1">
        {tool("Paragraph", state?.paragraph ?? false, () => editor?.chain().focus().setParagraph().run(), <Pilcrow aria-hidden />)}
        {tool("Heading", state?.heading ?? false, () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 aria-hidden />)}
        {tool("Bullet list", state?.list ?? false, () => editor?.chain().focus().toggleBulletList().run(), <List aria-hidden />)}
        {tool("Bold", state?.bold ?? false, () => editor?.chain().focus().toggleBold().run(), <Bold aria-hidden />)}
        {tool("Italic", state?.italic ?? false, () => editor?.chain().focus().toggleItalic().run(), <Italic aria-hidden />)}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
