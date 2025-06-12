import React, { useEffect, useRef } from 'react';

interface EmailEditorProps {
  value: string;
  onChange: (content: string) => void;
}

export function EmailEditor({ value, onChange }: EmailEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-300 p-2 bg-gray-50 flex items-center space-x-2">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 text-gray-600 hover:bg-gray-200 rounded"
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 text-gray-600 hover:bg-gray-200 rounded"
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-2 text-gray-600 hover:bg-gray-200 rounded"
          title="Underline"
        >
          <u>U</u>
        </button>
        <div className="w-px h-6 bg-gray-300"></div>
        <button
          type="button"
          onClick={() => {
            const url = prompt('Enter URL:');
            if (url) execCommand('createLink', url);
          }}
          className="p-2 text-gray-600 hover:bg-gray-200 rounded"
          title="Add Link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 text-gray-600 hover:bg-gray-200 rounded"
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-2 text-gray-600 hover:bg-gray-200 rounded"
          title="Numbered List"
        >
          1.
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 min-h-[300px] focus:outline-none"
        style={{ whiteSpace: 'pre-wrap' }}
        placeholder="Write your email content here..."
      />
    </div>
  );
}