"use client";

import { PiggyBank, Send } from "lucide-react";
import { useState } from "react";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "agent",
      content: "Hi! I'm your SaveSmart AI agent. I've reviewed your profile and I'm ready to help you save money! Ask me anything about groceries, fuel, bills, or savings goals."
    }
  ]);

  const handleSend = async () => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = message;
    setMessages(prev => [...prev, { type: "user", content: userMessage }]);
    setMessage("");

    // Add loading message
    setMessages(prev => [...prev, { type: "agent", content: "Thinking..." }]);

    try {
      // Get userId from localStorage (set during onboarding)
      const userId = localStorage.getItem("userId") || "demo-sarah-123";

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Remove loading message and add AI response
      setMessages(prev => {
        const withoutLoading = prev.slice(0, -1);
        return [...withoutLoading, { type: "agent", content: data.reply }];
      });

      // If there's a plan, show it in a formatted way
      if (data.plan) {
        const planMessage = `\n\n📊 **Savings Plan**\n\n**Goal:** ${data.plan.goal}\n**Timeline:** ${data.plan.timeline}\n**Monthly Target:** $${data.plan.monthly}\n\n**Breakdown:**\n${data.plan.breakdown.map((item: any) => `• ${item.category}: $${item.amount} - ${item.tip}`).join('\n')}`;
        setMessages(prev => [...prev, { type: "agent", content: planMessage }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Remove loading message and show error
      setMessages(prev => {
        const withoutLoading = prev.slice(0, -1);
        return [...withoutLoading, {
          type: "agent",
          content: "Sorry, I'm having trouble connecting to my AI brain right now. The n8n webhook might not be active. Please ask the AI team to activate the workflow!"
        }];
      });
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
              <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md p-4 rounded-lg ${
                  msg.type === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Ask me about saving money..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
              />
              <button
                onClick={handleSend}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Send</span>
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