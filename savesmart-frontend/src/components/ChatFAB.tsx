'use client';

import { MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import ChatOverlay from './ChatOverlay';

export default function ChatFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat Overlay */}
      {isOpen && <ChatOverlay onClose={() => setIsOpen(false)} />}
    </>
  );
}
