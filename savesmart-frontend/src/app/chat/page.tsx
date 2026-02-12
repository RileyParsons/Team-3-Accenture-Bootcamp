"use client";

import { PiggyBank, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { sendChatMessage, ChatMessage } from "@/lib/api";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm your SaveSmart AI agent. I've reviewed your profile and I'm ready to help you save money! Ask me anything about groceries, fuel, bills, or savings goals.",
      timestamp: new Date().toISOString()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get userId from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('savesmart_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserId(userData.userId);
    }
  }, []);

  const handleSend = async () => {
    if (message.trim() && userId && !isLoading) {
      const userMessage: ChatMessage = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString()
      };

      // Add user message to chat
      setMessages(prev => [...prev, userMessage]);
      const currentMessage = message;
      setMessage("");
      setIsLoading(true);

      try {
        // Send message to backend
        const response = await sendChatMessage(
          userId,
          currentMessage,
          messages // Send conversation history for context
        );

        if (response && response.reply) {
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: response.reply,
            timestamp: new Date().toISOString()
          };

          setMessages(prev => [...prev, assistantMessage]);

          // If there's a savings plan, you could display it differently
          if (response.plan) {
            console.log('Savings plan received:', response.plan);
          }

          if (response.savings) {
            console.log('Potential savings:', response.savings);
          }
        }
      } catch (error: any) {
        console.error('Chat error:', error);
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <nav className="px-6 py-4 bg-white shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-2">
            <PiggyBank className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-gray-900">SaveSmart</span>
          </div>
          <div className="text-sm text-gray-600">
            AI Savings Agent
          </div>
        </div>
      </nav>

      {/* Chat Interface */}
      <main className="max-w-4xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl shadow-lg h-[calc(100vh-200px)] flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md p-4 rounded-lg ${msg.role === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                  }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-md p-4 rounded-lg bg-gray-100 text-gray-900">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Ask me about saving money..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
                className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none disabled:bg-gray-100"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !message.trim()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                <span>{isLoading ? 'Sending...' : 'Send'}</span>
              </button>
            </div>
            <div className="mt-3">
              <div className="text-sm text-gray-500">
                Try asking: "Help me save money on groceries" or "I want to save $3000 in 6 months"
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
