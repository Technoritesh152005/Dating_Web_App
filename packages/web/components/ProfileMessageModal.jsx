'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export function ProfileMessageModal({ recipientUserId, recipientName, onClose, onSent }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    const message = content.trim();
    
    if (!message || sending) return;

    setSending(true);
    setError(null);

    try {
      await api.post('/profile-messages', {
        toUserId: recipientUserId,
        content: message,
      });
      setContent('');
      onSent?.();
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum-night/85 p-4 backdrop-blur-md animate-[fade-in_200ms_ease-out]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-[24px] border border-plum-border bg-plum-surface shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-pearl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-plum-border/50 bg-saffron-gradient p-4 text-pearl">
          <div>
            <p className="font-sans font-bold text-sm">Send a Message</p>
            <p className="font-mono text-xs text-pearl/80 mt-0.5">To {recipientName}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-plum-night/20 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <p className="text-xs text-pearl-dim">
            Send a personal message to start a conversation.
          </p>

          <form onSubmit={handleSend} className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              maxLength={280}
              rows={4}
              className="w-full rounded-xl border border-plum-border bg-plum-night/60 px-3 py-2 font-mono text-sm text-pearl outline-none placeholder:text-pearl-dim focus:border-saffron resize-none"
            />

            <div className="flex items-center justify-between">
              <p className="text-xs text-pearl-dim">
                {content.length}/280
              </p>
              {error && (
                <p className="text-xs text-sindoor-light">{error}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-plum-border/60 bg-plum-night/50 text-pearl font-mono text-xs font-bold hover:bg-plum-night transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!content.trim() || sending}
                className="px-4 py-2 rounded-lg bg-saffron-gradient text-pearl font-mono text-xs font-bold hover:scale-105 transition disabled:opacity-50 shadow-saffron-glow"
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
