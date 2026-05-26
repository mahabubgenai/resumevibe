"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface MatchScore {
  score: number;
  comment: string;
}

interface JobFitData {
  overall_fit_score: number;
  fit_label: string;
  summary: string;
  matching_keywords: string[];
  missing_keywords: string[];
  matching_skills: string[];
  missing_skills: string[];
  experience_match: MatchScore;
  education_match: MatchScore;
  skills_match: MatchScore;
  quick_fixes: string[];
  should_apply: boolean;
}

interface Props {
  file: File | null;
}

export default function JobFit({ file }: Props) {
  const [jobDesc, setJobDesc] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<JobFitData | null>(null);

  const handleAnalyze = async () => {
  if (!file) {
    toast.error("Please upload a resume first");
    return;
  }
  if (!jobDesc.trim()) {
    toast.error("Please enter a job description");
    return;
  }
  setLoading(true);
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDesc.trim());
    formData.append("job_title", jobTitle.trim());

    console.log("Sending job_description:", jobDesc.trim().substring(0, 50));

    const response = await axios.post(
      `${API_URL}/api/resume/job-fit`,
      formData
    );

    console.log("Response:", response.data);

    if (response.data.status === "error") {
      toast.error(response.data.error);
      return;
    }

    setData(response.data.job_fit);
    toast.success("Job fit analysis complete!");
  } catch (err) {
    console.error("Error:", err);
    toast.error("Analysis failed. Make sure backend is running.");
  } finally {
    setLoading(false);
  }
};

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (!data) {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Resume vs Job Fit</h3>
        <p className="text-gray-400 text-sm">
          Paste a job description to see exactly how well your resume
          matches — with keyword analysis and quick fixes.
        </p>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Job Title{" "}
            <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Python Developer"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Job Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={5}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition resize-none"
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={!file || !jobDesc.trim() || loading}
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
              Analyzing Fit...
            </span>
          ) : (
            "Analyze Job Fit →"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Resume vs Job Fit</h3>
        <button
          onClick={() => setData(null)}
          className="text-xs text-gray-500 hover:text-white transition"
        >
          Analyze Again
        </button>
      </div>

      {/* Overall Score */}
      <div className={`rounded-xl p-4 text-center border ${
        data.overall_fit_score >= 80
          ? "bg-emerald-500/10 border-emerald-500/30"
          : data.overall_fit_score >= 60
          ? "bg-blue-500/10 border-blue-500/30"
          : data.overall_fit_score >= 40
          ? "bg-yellow-500/10 border-yellow-500/30"
          : "bg-red-500/10 border-red-500/30"
      }`}>
        <p className={`text-6xl font-black ${scoreColor(data.overall_fit_score)}`}>
          {data.overall_fit_score}%
        </p>
        <p className={`text-sm font-bold mt-1 ${scoreColor(data.overall_fit_score)}`}>
          {data.fit_label} Match
        </p>
        <p className="text-xs text-gray-400 mt-2">{data.summary}</p>
      </div>

      {/* Should Apply */}
      <div className={`rounded-xl p-3 flex items-center gap-3 ${
        data.should_apply
          ? "bg-emerald-500/10 border border-emerald-500/20"
          : "bg-red-500/10 border border-red-500/20"
      }`}>
        <span className="text-2xl">{data.should_apply ? "✅" : "⚠️"}</span>
        <p className={`text-sm font-bold ${
          data.should_apply ? "text-emerald-400" : "text-red-400"
        }`}>
          {data.should_apply
            ? "You should apply for this job!"
            : "Improve your resume before applying"}
        </p>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400">Score Breakdown</p>
        {[
          { label: "Skills Match", data: data.skills_match },
          { label: "Experience Match", data: data.experience_match },
          { label: "Education Match", data: data.education_match },
        ].map(({ label, data: matchData }) => (
          <div key={label} className="bg-gray-800 rounded-xl p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">{label}</span>
              <span className={`text-xs font-bold ${scoreColor(matchData.score)}`}>
                {matchData.score}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${scoreBg(matchData.score)}`}
                style={{ width: `${matchData.score}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{matchData.comment}</p>
          </div>
        ))}
      </div>

      {/* Keywords */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-xl p-3">
          <p className="text-xs font-semibold text-emerald-400 mb-2">
            Matching Keywords
          </p>
          <div className="flex flex-wrap gap-1">
            {data.matching_keywords.slice(0, 8).map((k) => (
              <span
                key={k}
                className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-3">
          <p className="text-xs font-semibold text-red-400 mb-2">
            Missing Keywords
          </p>
          <div className="flex flex-wrap gap-1">
            {data.missing_keywords.slice(0, 8).map((k) => (
              <span
                key={k}
                className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full"
              >
                + {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Fixes */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-yellow-400 mb-2">
          Quick Fixes Before Applying:
        </p>
        <ul className="space-y-1">
          {data.quick_fixes.map((fix, i) => (
            <li key={i} className="text-xs text-gray-300 flex gap-2">
              <span className="text-yellow-400 flex-shrink-0">{i + 1}.</span>
              {fix}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}