"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CoverLetterData {
  subject_line: string;
  cover_letter: string;
  key_points_highlighted: string[];
  personalization_tips: string[];
}

interface Props {
  file: File | null;
}

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "enthusiastic", label: "Enthusiastic" },
  { value: "confident", label: "Confident" },
  { value: "creative", label: "Creative" },
];

export default function CoverLetter({ file }: Props) {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CoverLetterData | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!file) {
      toast.error("Please upload a resume first");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("job_title", jobTitle);
      formData.append("company_name", companyName);
      formData.append("job_description", jobDesc);
      formData.append("tone", tone);

      const response = await axios.post(
        `${API_URL}/api/resume/cover-letter`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setData(response.data.cover_letter);
      toast.success("Cover letter generated!");
    } catch {
      toast.error("Failed to generate. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.cover_letter);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Cover Letter Generator</h3>
        <p className="text-gray-400 text-sm">
          Generate a personalized cover letter tailored to the job and company.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Job Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Network Engineer"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google, Microsoft"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Tone
          </label>
          <div className="flex gap-2 flex-wrap">
            {TONE_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  tone === t.value
                    ? "bg-emerald-500 text-black"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Job Description{" "}
            <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="Paste job description for better personalization..."
            rows={3}
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
            "Generate Cover Letter →"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Cover Letter Generator</h3>
        <button
          onClick={() => setData(null)}
          className="text-xs text-gray-500 hover:text-white transition"
        >
          Regenerate
        </button>
      </div>

      {/* Subject Line */}
      <div className="bg-gray-800 rounded-xl p-3">
        <p className="text-xs font-semibold text-blue-400 mb-1">
          Email Subject Line:
        </p>
        <p className="text-sm text-white font-semibold">{data.subject_line}</p>
      </div>

      {/* Cover Letter */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-semibold text-emerald-400">
            Cover Letter:
          </p>
          <button
            onClick={handleCopy}
            className="text-xs bg-emerald-500 text-black px-3 py-1 rounded-lg font-bold hover:bg-emerald-400 transition"
          >
            {copied ? "Copied! ✓" : "Copy"}
          </button>
        </div>
        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
          {data.cover_letter}
        </div>
      </div>

      {/* Key Points */}
      {data.key_points_highlighted?.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-purple-400 mb-2">
            Key Points Highlighted:
          </p>
          <ul className="space-y-1">
            {data.key_points_highlighted.map((point, i) => (
              <li key={i} className="text-xs text-gray-300 flex gap-2">
                <span className="text-purple-400 flex-shrink-0">✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Personalization Tips */}
      {data.personalization_tips?.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-yellow-400 mb-2">
            Personalization Tips:
          </p>
          <ul className="space-y-1">
            {data.personalization_tips.map((tip, i) => (
              <li key={i} className="text-xs text-gray-300 flex gap-2">
                <span className="text-yellow-400 flex-shrink-0">{i + 1}.</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}