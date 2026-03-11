'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import type { JSONContent } from '@tiptap/react';

const btnBase = 'rounded-md px-2 py-1 text-[13px] font-medium transition-colors';
const btnActive = 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100';
const btnInactive = 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800';

function ToolbarButton({
  active,
  onClick,
  children,
  className = '',
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${btnBase} ${active ? btnActive : btnInactive} ${className}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  return (
    <div className="flex gap-1 border-b border-gray-100 dark:border-gray-800 px-2 py-2">
      <ToolbarButton
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className="font-bold"
      >
        B
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className="italic"
      >
        I
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className="underline"
      >
        U
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className="line-through"
      >
        S
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
        className="font-mono"
      >
        {'< >'}
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="2" cy="4" r="1.5" />
          <circle cx="2" cy="8" r="1.5" />
          <circle cx="2" cy="12" r="1.5" />
          <rect x="6" y="3" width="9" height="2" rx="0.5" />
          <rect x="6" y="7" width="9" height="2" rx="0.5" />
          <rect x="6" y="11" width="9" height="2" rx="0.5" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <text x="0" y="5.5" fontSize="5" fontWeight="600">
            1
          </text>
          <text x="0" y="9.5" fontSize="5" fontWeight="600">
            2
          </text>
          <text x="0" y="13.5" fontSize="5" fontWeight="600">
            3
          </text>
          <rect x="6" y="3" width="9" height="2" rx="0.5" />
          <rect x="6" y="7" width="9" height="2" rx="0.5" />
          <rect x="6" y="11" width="9" height="2" rx="0.5" />
        </svg>
      </ToolbarButton>
    </div>
  );
}

interface TiptapEditorProps {
  content?: JSONContent | null;
  onChange?: (content: JSONContent) => void;
  placeholder?: string;
  editable?: boolean;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  editable = true,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
    ],
    content: content ?? undefined,
    editable,
    editorProps: {
      attributes: {
        class: editable
          ? 'prose prose-sm max-w-none min-h-[160px] px-3 py-2 focus:outline-none [&_code]:bg-red-50 [&_code]:dark:bg-red-900/20 [&_code]:text-red-600 [&_code]:dark:text-red-400 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:font-mono [&_code]:before:content-none [&_code]:after:content-none [&_p.is-editor-empty:first-child::before]:text-gray-400 [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:h-0'
          : 'text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap [&_code]:bg-red-50 [&_code]:dark:bg-red-900/20 [&_code]:text-red-600 [&_code]:dark:text-red-400 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:font-mono',
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  if (!editor) return null;

  return (
    <div
      className={
        editable
          ? 'rounded-lg border border-gray-200 dark:border-gray-700 focus-within:border-gray-400 dark:focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-900/10 dark:focus-within:ring-gray-100/10 transition-colors'
          : ''
      }
    >
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

// Render Tiptap JSON content as read-only HTML
export function TiptapReadOnly({ content }: { content: JSONContent | null }) {
  if (!content) return <p className="text-sm text-gray-400 dark:text-gray-500">No content</p>;
  return <TiptapEditor content={content} editable={false} />;
}
