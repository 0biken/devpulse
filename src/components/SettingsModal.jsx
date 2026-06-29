import { useState, useEffect } from 'react';
import { IconX, IconKey, IconCheck } from '@tabler/icons-react';

export function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(localStorage.getItem('devpulse_gemini_key') || '');
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('devpulse_gemini_key', apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    localStorage.removeItem('devpulse_gemini_key');
    setApiKey('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-[var(--dp-surface)] border border-[var(--dp-border)] rounded-xl shadow-2xl overflow-hidden p-5 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[var(--dp-text)] flex items-center gap-2">
            <IconKey size={20} className="text-[var(--dp-amber)]" />
            Settings
          </h2>
          <button onClick={onClose} className="text-[var(--dp-hint)] hover:text-[var(--dp-text)] transition-colors">
            <IconX size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--dp-muted)] mb-1.5">
              Google Gemini API Key
            </label>
            <p className="text-xs text-[var(--dp-hint)] mb-3 leading-relaxed">
              Required for AI features (Live Tech Tips & Article Summaries). Your key is stored securely in your browser's local storage and is never sent anywhere except directly to Google's API.
            </p>
            <input
              type="password"
              className="w-full bg-[#111113] border border-[var(--dp-border)] rounded-md px-3 py-2 text-sm text-[var(--dp-text)] outline-none focus:border-[var(--dp-blue)] transition-colors"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button 
              onClick={handleClear}
              className="px-4 py-1.5 text-sm text-[var(--dp-hint)] hover:text-[var(--dp-coral)] transition-colors"
            >
              Clear Key
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-1.5 bg-[var(--dp-blue)] hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2 min-w-[80px] justify-center"
            >
              {saved ? <><IconCheck size={16} /> Saved</> : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
