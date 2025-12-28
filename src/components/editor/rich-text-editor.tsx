'use client';

import { useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
} from 'lucide-react';

interface RichTextEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  initialContent,
  onChange,
  placeholder = '开始写作...',
  minHeight = '200px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  // 初始化内容（只执行一次）
  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = () => {
    if (editorRef.current && !isComposingRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    // 输入法结束后再同步内容
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // 执行编辑器命令
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleChange();
  };

  // 插入链接
  const insertLink = () => {
    const url = prompt('请输入链接地址：', 'https://');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const toolbarButtons = [
    { icon: Bold, label: '加粗', command: 'bold' },
    { icon: Italic, label: '斜体', command: 'italic' },
    { icon: List, label: '无序列表', command: 'insertUnorderedList' },
    { icon: ListOrdered, label: '有序列表', command: 'insertOrderedList' },
    { icon: LinkIcon, label: '链接', action: insertLink },
    { icon: AlignLeft, label: '左对齐', command: 'justifyLeft' },
    { icon: AlignCenter, label: '居中', command: 'justifyCenter' },
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        {toolbarButtons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.label}
              type="button"
              onClick={() => btn.action ? btn.action() : execCommand(btn.command!)}
              className="p-2 hover:bg-gray-200 rounded transition-colors touch-target"
              title={btn.label}
            >
              <Icon className="w-4 h-4 text-gray-700" />
            </button>
          );
        })}
      </div>

      {/* 编辑区域 */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        suppressContentEditableWarning
        className="p-4 outline-none prose prose-sm max-w-none"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }

        [contenteditable] ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }

        [contenteditable] ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }

        [contenteditable] a {
          color: #2563eb;
          text-decoration: underline;
        }

        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
