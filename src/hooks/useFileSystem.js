import { useState, useEffect } from 'react';

const FS_STORAGE_KEY = 'devpulse_vfs';

const defaultFiles = {
  'welcome.js': '// Welcome to DevPulse Snippet Studio!\n// Test out your ideas here.\n\nconsole.log("Hello, World!");\n',
  'scratch.md': '# Scratchpad\nTake notes or paste code snippets here.\n'
};

export function useFileSystem() {
  const [files, setFiles] = useState(() => {
    try {
      const saved = localStorage.getItem(FS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load file system', e);
    }
    return defaultFiles;
  });

  const [activeFile, setActiveFile] = useState('welcome.js');

  // Persist changes
  useEffect(() => {
    localStorage.setItem(FS_STORAGE_KEY, JSON.stringify(files));
  }, [files]);

  const updateFile = (filename, content) => {
    setFiles(prev => ({ ...prev, [filename]: content }));
  };

  const createFile = (filename, initialContent = '') => {
    if (!files[filename]) {
      setFiles(prev => ({ ...prev, [filename]: initialContent }));
      setActiveFile(filename);
    } else {
      // If it exists, just open it
      setActiveFile(filename);
    }
  };

  const deleteFile = (filename) => {
    setFiles(prev => {
      const next = { ...prev };
      delete next[filename];
      return next;
    });
    if (activeFile === filename) {
      const remaining = Object.keys(files).filter(f => f !== filename);
      setActiveFile(remaining.length > 0 ? remaining[0] : null);
    }
  };

  return {
    files,
    activeFile,
    setActiveFile,
    updateFile,
    createFile,
    deleteFile
  };
}
