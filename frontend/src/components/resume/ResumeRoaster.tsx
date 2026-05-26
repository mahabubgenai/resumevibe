"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RoastData {
  roast_title: string;
  roast_lines: string[];
  savage_score: number;
  verdict: string;
  serious_fixes: string[];
  one_liner: string;
}

interface Props {
  file: File | null;
}

export default function ResumeRoaster({ file }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RoastData | null>(null);

  const handleRoast = async () => {
    if (!file) {
      toast.error("Please upload a resume first");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(
        `${API_URL}/api/resume/roast`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setData(response.data.roast);
      toast.success("Your resume has been roasted!");
    } catch {
      toast.error("Roast failed. Backend running?");
    } finally {
      setLoading(false);
    }
  };

  const savageColor = (score: number) => {
    if (score >= 8) return "text-red-400";
    if (score >= 5) return "text-yellow-400";
    return "text-emerald-400";
  };

  if (!data) {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Resume Roaster</h3>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-sm text-red-400 font-semibold mb-1">
            Warning: Not for the faint-hearted!
          </p>
          <p className="text-xs text-gray-400">
            AI will roast your resume with humor + give you real feedback.
            Brace yourself.
          </p>
        </div>
        <button
          onClick={handleRoast}
          disabled={!file || loading}
          className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-400 transition disabled:opacity-50"
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
              Roasting...
            </span>
          ) : (
            "Roast My Resume"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Resume Roaster</h3>
        <button
          onClick={() => setData(null)}
          className="text-xs text-gray-500 hover:text-white transition"
        >
          Roast Again
        </button>
      </div>

      {/* Roast Title */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
        <p className="text-xs text-red-400 font-semibold mb-1">
          Your Resume Title:
        </p>
        <p className="text-xl font-black text-white">{data.roast_title}</p>
      </div>

      {/* Savage Score */}
      <div className="flex items-center justify-between bg-gray-800 rounded-xl p-4">
        <div>
          <p className="text-xs text-gray-400">Savage Score</p>
          <p className="text-xs text-gray-500">(10 = needs most work)</p>
        </div>
        <div className="text-right">
          <span className={`text-5xl font-black ${savageColor(data.savage_score)}`}>
            {data.savage_score}
          </span>
          <span className="text-gray-500 text-lg">/10</span>
        </div>
      </div>

      {/* One Liner */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-yellow-400 mb-1">
          The Verdict in One Line:
        </p>
        <p className="text-sm text-white italic">&quot;{data.one_liner}&quot;</p>
      </div>

      {/* Roast Lines */}
      <div className="bg-gray-800 rounded-xl p-4 space-y-3 max-h-48 overflow-y-auto">
        <p className="text-xs font-semibold text-red-400">The Roast:</p>
        {data.roast_lines.map((line, i) => (
          <div key={i} className="flex gap-2 text-sm text-gray-300">
            <span className="text-red-400 flex-shrink-0">{i + 1}.</span>
            {line}
          </div>
        ))}
      </div>

      {/* Verdict */}
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 mb-2">Verdict:</p>
        <p className="text-sm text-gray-300">{data.verdict}</p>
      </div>

      {/* Serious Fixes */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-emerald-400 mb-2">
          OK, seriously though — fix these:
        </p>
        <ul className="space-y-1">
          {data.serious_fixes.map((fix, i) => (
            <li key={i} className="text-xs text-gray-300 flex gap-2">
              <span className="text-emerald-400 flex-shrink-0">{i + 1}.</span>
              {fix}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}