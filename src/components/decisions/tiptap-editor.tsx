'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { JSONContent } from '@tiptap/react';

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
    ],
    content: content ?? undefined,
    editable,
    editorProps: {
      attributes: {
        class: editable
          ? 'prose prose-sm max-w-none min-h-[100px] px-3 py-2 focus:outline-none [&_p.is-editor-empty:first-child::before]:text-gray-400 [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:h-0'
          : 'text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap',
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
      {editable && (
        <div className="flex gap-1 border-b border-gray-100 dark:border-gray-800 px-2 py-1.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`rounded-md px-2 py-1 text-xs font-medium ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`rounded-md px-2 py-1 text-xs font-medium italic ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            I
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`rounded-md px-2 py-1 text-xs font-medium ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            List
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

// Render Tiptap JSON content as read-only HTML
export function TiptapReadOnly({ content }: { content: JSONContent | null }) {
  if (!content) return <p className="text-sm text-gray-400 dark:text-gray-500">No content</p>;
  return <TiptapEditor content={content} editable={false} />;
}
