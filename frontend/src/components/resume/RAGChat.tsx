"use client";

import { useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  resumeText?: string;
}

const SUGGESTED_QUESTIONS = [
  "How can I improve my ATS score?",
  "What keywords should I add?",
  "How to write a better summary?",
  "What are common resume mistakes?",
];

export default function RAGChat({ resumeText = "" }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I am your AI resume coach. Ask me anything about improving your resume!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (question?: string) => {
    const q = question || input.trim();
    if (!q) return;

    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/rag/ask`, {
        question: q,
        resume_text: resumeText,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I could not process that. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="font-bold text-lg mb-4">
        AI Resume Coach
      </h3>

      {/* Suggested Questions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1 rounded-full transition disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-emerald-500 text-black"
                  : "bg-gray-800 text-gray-300"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl px-4 py-2 text-sm text-gray-400 animate-pulse">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about your resume..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="bg-emerald-500 text-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-400 transition disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}