"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface QA {
  question: string;
  ideal_answer: string;
  difficulty?: string;
  tip?: string;
}

interface AskQuestion {
  question: string;
  why_ask: string;
}

interface InterviewData {
  technical: QA[];
  behavioral: QA[];
  situational: QA[];
  about_resume: QA[];
  to_ask_interviewer: AskQuestion[];
}

interface Props {
  file: File | null;
}

export default function InterviewPrep({ file }: Props) {
  const [jobDesc, setJobDesc] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InterviewData | null>(null);
  const [activeCategory, setActiveCategory] = useState("technical");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!file) {
      toast.error("Please upload a resume first");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("job_description", jobDesc);
      formData.append("job_title", jobTitle);

      const response = await axios.post(
        `${API_URL}/api/resume/interview-prep`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setData(response.data.interview_qa);
      toast.success("Interview questions generated!");
    } catch {
      toast.error("Failed to generate. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const difficultyColor = (d?: string) => {
    if (d === "hard") return "bg-red-500/20 text-red-400";
    if (d === "medium") return "bg-yellow-500/20 text-yellow-400";
    return "bg-emerald-500/20 text-emerald-400";
  };

  const categories = [
    {
      key: "technical",
      label: "Technical",
      count: data?.technical?.length || 0,
    },
    {
      key: "behavioral",
      label: "Behavioral",
      count: data?.behavioral?.length || 0,
    },
    {
      key: "situational",
      label: "Situational",
      count: data?.situational?.length || 0,
    },
    {
      key: "about_resume",
      label: "About Resume",
      count: data?.about_resume?.length || 0,
    },
    {
      key: "to_ask_interviewer",
      label: "Ask Interviewer",
      count: data?.to_ask_interviewer?.length || 0,
    },
  ];

  if (!data) {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Interview Prep</h3>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Job Title{" "}
            <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Network Engineer, Python Developer"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Job Description{" "}
            <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="Paste job description for targeted questions..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition resize-none"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={!file || loading}
          className="w-full bg-emerald-500 text-black font-bold py-3 rounded-xl hover:bg-emerald-400 transition disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Generating...
            </span>
          ) : (
            "Generate Interview Questions →"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Interview Prep</h3>
        <button
          onClick={() => {
            setData(null);
            setExpandedIndex(null);
          }}
          className="text-xs text-gray-500 hover:text-white transition"
        >
          Regenerate
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => {
              setActiveCategory(cat.key);
              setExpandedIndex(null);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeCategory === cat.key
                ? "bg-emerald-500 text-black"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {cat.label}
            {cat.count > 0 && (
              <span className="ml-1 opacity-70">({cat.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Questions */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {activeCategory === "to_ask_interviewer" ? (
          <div className="space-y-2">
            {data.to_ask_interviewer.map((q, i) => (
              <div
                key={i}
                className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedIndex(expandedIndex === i ? null : i)
                  }
                  className="w-full text-left p-4 hover:bg-gray-700/50 transition"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-2 items-start">
                      <span className="text-emerald-400 font-black text-xs flex-shrink-0">
                        Q{i + 1}
                      </span>
                      <p className="text-sm font-semibold text-white">
                        {typeof q === "string" ? q : q.question}
                      </p>
                    </div>
                    <span className="text-gray-500 text-xs flex-shrink-0">
                      {expandedIndex === i ? "▲" : "▼"}
                    </span>
                  </div>
                </button>
                {expandedIndex === i && typeof q !== "string" && q.why_ask && (
                  <div className="px-4 pb-4 border-t border-gray-700">
                    <p className="text-xs font-semibold text-blue-400 mt-3 mb-1">
                      Why ask this:
                    </p>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {q.why_ask}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          (data[activeCategory as keyof InterviewData] as QA[])?.map(
            (qa, i) => (
              <div
                key={i}
                className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedIndex(expandedIndex === i ? null : i)
                  }
                  className="w-full text-left p-4 hover:bg-gray-700/50 transition"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-2 items-start">
                      <span className="text-emerald-400 font-black text-xs flex-shrink-0">
                        Q{i + 1}
                      </span>
                      <p className="text-sm font-semibold text-white">
                        {qa.question}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {qa.difficulty && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor(qa.difficulty)}`}
                        >
                          {qa.difficulty}
                        </span>
                      )}
                      <span className="text-gray-500 text-xs">
                        {expandedIndex === i ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>
                </button>
                {expandedIndex === i && (
                  <div className="px-4 pb-4 border-t border-gray-700">
                    <p className="text-xs font-semibold text-emerald-400 mt-3 mb-1">
                      Ideal Answer:
                    </p>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {qa.ideal_answer}
                    </p>
                    {qa.tip && (
                      <div className="mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                        <p className="text-xs text-yellow-400">
                          Tip: {qa.tip}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}