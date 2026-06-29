import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { IconFile, IconPlus, IconTrash, IconBrandJavascript, IconMarkdown, IconCode } from '@tabler/icons-react';

export function EditorPane({ fs, onClose }) {
  const { files, activeFile, setActiveFile, updateFile, createFile, deleteFile } = fs;
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  const handleCreate = (e) => {
    e.preventDefault();
    if (newFileName.trim()) {
      createFile(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const getLanguage = (filename) => {
    if (!filename) return 'javascript';
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.md')) return 'markdown';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.html')) return 'html';
    return 'plaintext';
  };

  const getFileIcon = (filename) => {
    if (filename.endsWith('.js')) return <IconBrandJavascript size={14} className="text-yellow-400" />;
    if (filename.endsWith('.md')) return <IconMarkdown size={14} className="text-blue-400" />;
    return <IconCode size={14} className="text-gray-400" />;
  };

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 13,
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    lineHeight: 1.6,
    padding: { top: 16 },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    formatOnPaste: true,
  };

  return (
    <div className="flex h-full w-full bg-[#1e1e1e] border-l border-[var(--dp-border)]">
      {/* File Tree Sidebar */}
      <div className="w-48 flex-shrink-0 flex flex-col bg-[#18181a] border-r border-[#2d2d2d] select-none">
        <div className="px-3 py-2 text-xs font-semibold tracking-wider text-gray-400 uppercase flex items-center justify-between border-b border-[#2d2d2d]">
          <span>WORKSPACE</span>
          <button 
            onClick={() => setIsCreating(true)}
            className="hover:text-white transition-colors p-1 rounded hover:bg-[#2d2d2d]"
          >
            <IconPlus size={14} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          {Object.keys(files).map(filename => (
            <div 
              key={filename}
              className={`flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer group ${activeFile === filename ? 'bg-[#2d2d2d] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#222]'}`}
              onClick={() => setActiveFile(filename)}
            >
              <div className="flex items-center gap-2 truncate">
                {getFileIcon(filename)}
                <span className="truncate">{filename}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteFile(filename); }}
                className={`text-gray-500 hover:text-red-400 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${Object.keys(files).length === 1 ? 'hidden' : ''}`}
              >
                <IconTrash size={12} />
              </button>
            </div>
          ))}

          {isCreating && (
            <form onSubmit={handleCreate} className="px-3 py-1.5">
              <input
                autoFocus
                type="text"
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                onBlur={() => setIsCreating(false)}
                placeholder="filename.js"
                className="w-full bg-[#0d0d0d] border border-[#3d3d3d] rounded px-2 py-0.5 text-sm text-white outline-none focus:border-[var(--dp-blue)]"
              />
            </form>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        {activeFile ? (
          <>
            <div className="flex h-9 items-center bg-[#1e1e1e] px-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 px-3 py-1 bg-[#1e1e1e] text-white text-sm border-t-2 border-[var(--dp-blue)]">
                {getFileIcon(activeFile)}
                {activeFile}
              </div>
            </div>
            <div className="flex-1 relative">
              <Editor
                height="100%"
                language={getLanguage(activeFile)}
                theme="vs-dark"
                value={files[activeFile]}
                onChange={(val) => updateFile(activeFile, val || '')}
                options={editorOptions}
                loading={<div className="flex h-full items-center justify-center text-gray-500 text-sm">Loading editor...</div>}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            No file open
          </div>
        )}
      </div>
    </div>
  );
}
