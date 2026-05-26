"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RewriteData {
  rewritten_summary: string;
  rewritten_experience: string[];
  rewritten_skills: string[];
  improvements_made: string[];
  ats_keywords_added: string[];
  overall_improvement: string;
}

interface Props {
  file: File | null;
}

export default function ResumeRewriter({ file }: Props) {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RewriteData | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [copied, setCopied] = useState<string | null>(null);

  const handleRewrite = async () => {
    if (!file) {
      toast.error("Please upload a resume first");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("job_title", jobTitle);
      formData.append("job_description", jobDesc);

      const response = await axios.post(
        `${API_URL}/api/resume/rewrite`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setData(response.data.rewrite);
      toast.success("Resume rewritten successfully!");
    } catch {
      toast.error("Rewrite failed. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  if (!data) {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Resume Rewriter</h3>
        <p className="text-gray-400 text-sm">
          AI will professionally rewrite your resume with strong action
          verbs, quantified achievements, and ATS keywords.
        </p>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Target Job Title{" "}
            <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Network Engineer"
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
            placeholder="Paste job description for targeted rewriting..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 transition resize-none"
          />
        </div>
        <button
          onClick={handleRewrite}
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
              Rewriting...
            </span>
          ) : (
            "Rewrite My Resume →"
          )}
        </button>
      </div>
    );
  }

  const tabs = [
    { key: "summary", label: "Summary" },
    { key: "experience", label: "Experience" },
    { key: "skills", label: "Skills" },
    { key: "improvements", label: "What Changed" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Resume Rewriter</h3>
        <button
          onClick={() => setData(null)}
          className="text-xs text-gray-500 hover:text-white transition"
        >
          Rewrite Again
        </button>
      </div>

      {/* Overall */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
        <p className="text-xs text-gray-300">{data.overall_improvement}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeTab === tab.key
                ? "bg-emerald-500 text-black"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-72 overflow-y-auto space-y-3">
        {activeTab === "summary" && (
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-emerald-400">
                Rewritten Summary
              </p>
              <button
                onClick={() =>
                  copyToClipboard(data.rewritten_summary, "summary")
                }
                className="text-xs text-gray-500 hover:text-white transition"
              >
                {copied === "summary" ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {data.rewritten_summary}
            </p>
          </div>
        )}

        {activeTab === "experience" && (
          <div className="space-y-2">
            {data.rewritten_experience.map((bullet, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-3 flex gap-2">
                <span className="text-emerald-400 flex-shrink-0 text-xs mt-0.5">
                  •
                </span>
                <p className="text-sm text-gray-300">
                  {typeof bullet === "string"
                    ? bullet
                    : JSON.stringify(bullet)}
                </p>
              </div>
            ))}
            <button
              onClick={() =>
                copyToClipboard(
                  data.rewritten_experience
                    .map((b) =>
                      typeof b === "string" ? b : JSON.stringify(b)
                    )
                    .join("\n"),
                  "experience"
                )
              }
              className="w-full text-xs text-gray-500 hover:text-white py-2 transition"
            >
              {copied === "experience" ? "Copied!" : "Copy All"}
            </button>
          </div>
        )}

        {activeTab === "skills" && (
          <div className="space-y-2">
            {Array.isArray(data.rewritten_skills) ? (
              data.rewritten_skills.map((skill, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-3">
                  <p className="text-sm text-gray-300">
                    {typeof skill === "string"
                      ? skill
                      : typeof skill === "object" && skill !== null
                      ? Object.entries(skill)
                          .map(([k, v]) =>
                            `${k}: ${Array.isArray(v) ? v.join(", ") : v}`
                          )
                          .join(" | ")
                      : JSON.stringify(skill)}
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-sm text-gray-300">
                  {typeof data.rewritten_skills === "object"
                    ? Object.entries(data.rewritten_skills)
                        .map(([k, v]) =>
                          `${k}: ${Array.isArray(v) ? v.join(", ") : v}`
                        )
                        .join("\n")
                    : String(data.rewritten_skills)}
                </p>
              </div>
            )}
            <div className="mt-3">
              <p className="text-xs font-semibold text-blue-400 mb-2">
                ATS Keywords Added:
              </p>
              <div className="flex flex-wrap gap-1">
                {data.ats_keywords_added.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full"
                  >
                    + {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}


        {activeTab === "improvements" && (
          <div className="space-y-2">
            {data.improvements_made.map((imp, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-3 flex gap-2">
                <span className="text-emerald-400 flex-shrink-0 text-xs">
                  ✓
                </span>
                <p className="text-sm text-gray-300">{imp}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}