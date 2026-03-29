'use client';

import { useState, useRef, useEffect } from 'react';
import { useSessionContext } from '@/contexts/SessionContext';

export default function SessionChat() {
  const { messages, sendMessage, participantId } = useSessionContext();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Say hi!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`${
                msg.type === 'system'
                  ? 'text-center'
                  : msg.senderId === participantId
                  ? 'flex justify-end'
                  : 'flex justify-start'
              }`}
            >
              {msg.type === 'system' ? (
                <span className="text-xs text-gray-500 bg-[#1a1a1a] px-3 py-1 rounded-full">
                  {msg.message}
                </span>
              ) : (
                <div
                  className={`max-w-[80%] ${
                    msg.senderId === participantId
                      ? 'bg-green-600 text-white'
                      : 'bg-[#252525] text-white'
                  } rounded-lg px-3 py-2`}
                >
                  {msg.senderId !== participantId && (
                    <p className="text-xs text-gray-400 mb-1">{msg.senderName}</p>
                  )}
                  <p className="text-sm">{msg.message}</p>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-[#333]">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-[#252525] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className={`px-4 rounded-lg transition-colors ${
              newMessage.trim() && !isSending
                ? 'bg-green-600 text-white hover:bg-green-500'
                : 'bg-[#333] text-gray-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
