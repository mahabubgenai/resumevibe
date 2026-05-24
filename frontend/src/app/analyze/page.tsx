"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import Link from "next/link";
import { analyzeResume, matchJob } from "@/lib/api";
import { ResumeAnalysis, JobMatch } from "@/types";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/analyze";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ProgressStep {
  step: number;
  total: number;
  status: "waiting" | "running" | "done" | "error";
  message: string;
}

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [matchResult, setMatchResult] = useState<JobMatch | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const STEP_LABELS = [
    "Parse Resume",
    "Extract Sections",
    "Calculate ATS Score",
    "LLM Analysis",
    "Job Matching",
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (f) {
      setFile(f);
      setAnalysis(null);
      setMatchResult(null);
      setSteps([]);
      toast.success(`${f.name} uploaded!`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
  });

  // Initialize steps
  const initSteps = () => {
    setSteps(
      STEP_LABELS.map((label, i) => ({
        step: i + 1,
        total: 5,
        status: "waiting",
        message: label,
      }))
    );
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error("Please upload a resume first");
      return;
    }

    setLoading(true);
    setAnalysis(null);
    initSteps();

    try {
      // Upload file first — get temp path via REST
      const result = await analyzeResume(file);

      // Simulate WebSocket progress
      const progressSteps = [
        { step: 1, message: `📄 Parsing resume...` },
        { step: 1, message: `✅ Parsed (${result.word_count} words)` },
        { step: 2, message: "🔍 Extracting sections & skills..." },
        {
          step: 2,
          message: `✅ Found ${result.section_stats.total_sections} sections`,
        },
        { step: 3, message: "📊 Calculating ATS score..." },
        {
          step: 3,
          message: `✅ ATS Score: ${result.ats_score} (${result.quality_label})`,
        },
        { step: 4, message: "🧠 Running LLM analysis (Groq)..." },
        { step: 4, message: "✅ LLM analysis complete" },
        { step: 5, message: "🎯 Matching job description..." },
        { step: 5, message: "✅ Analysis complete!" },
      ];

      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise((r) => setTimeout(r, 300));
        const s = progressSteps[i];
        setSteps((prev) =>
          prev.map((step) =>
            step.step === s.step
              ? {
                  ...step,
                  status: s.message.startsWith("✅") ? "done" : "running",
                  message: s.message,
                }
              : step
          )
        );
      }

      setAnalysis(result);

      if (jobDesc.trim()) {
        const match = await matchJob(file, jobDesc);
        setMatchResult(match);
      }

      toast.success("Analysis complete!");
    } catch {
      toast.error("Analysis failed. Make sure the backend is running.");
      setSteps([]);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 86) return "text-emerald-400";
    if (score >= 71) return "text-blue-400";
    if (score >= 41) return "text-yellow-400";
    return "text-red-400";
  };

  const scoreBg = (score: number) => {
    if (score >= 86) return "bg-emerald-500/20 border-emerald-500/30";
    if (score >= 71) return "bg-blue-500/20 border-blue-500/30";
    if (score >= 41) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-black">
              R
            </div>
            <span className="text-xl font-bold">ResumeVibe</span>
          </Link>
          <div className="flex gap-4">
            <Link
              href="/pricing"
              className="text-gray-400 hover:text-white transition text-sm"
            >
              Pricing
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white transition text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left — Upload */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black mb-2">Analyze Your Resume</h1>
              <p className="text-gray-400">
                Upload PDF or DOCX — get instant AI feedback
              </p>
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
                isDragActive
                  ? "border-emerald-500 bg-emerald-500/5"
                  : file
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-gray-700 hover:border-gray-500"
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div>
                  <div className="text-5xl mb-4">📄</div>
                  <p className="text-emerald-400 font-semibold">{file.name}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                  <p className="text-gray-600 text-xs mt-2">
                    Drop another file to replace
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-5xl mb-4">📁</div>
                  <p className="text-gray-300 font-semibold">
                    {isDragActive
                      ? "Drop it here!"
                      : "Drag & drop your resume"}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    PDF or DOCX supported
                  </p>
                </div>
              )}
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Job Description{" "}
                <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                placeholder="Paste the job description to get match score..."
                rows={4}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition resize-none"
              />
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="w-full bg-emerald-500 text-black font-bold py-4 rounded-xl text-lg hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-5 h-5"
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
                  Analyzing...
                </span>
              ) : (
                "Analyze Resume →"
              )}
            </button>

            {/* Progress Steps */}
            {steps.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
                <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">
                  Analysis Progress
                </h3>
                {steps.map((step) => (
                  <div key={step.step} className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                        step.status === "done"
                          ? "bg-emerald-500 text-black"
                          : step.status === "running"
                          ? "bg-yellow-500 text-black animate-pulse"
                          : "bg-gray-700 text-gray-500"
                      }`}
                    >
                      {step.status === "done"
                        ? "✓"
                        : step.status === "running"
                        ? "⟳"
                        : step.step}
                    </div>
                    <span
                      className={`text-sm ${
                        step.status === "done"
                          ? "text-emerald-400"
                          : step.status === "running"
                          ? "text-yellow-400"
                          : "text-gray-600"
                      }`}
                    >
                      {step.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — Results */}
          <div>
            {!analysis ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <div className="text-6xl mb-4">🤖</div>
                  <p className="text-lg">
                    Upload your resume to see AI analysis
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`border rounded-2xl p-6 text-center ${scoreBg(analysis.ats_score)}`}
                  >
                    <div
                      className={`text-5xl font-black ${scoreColor(analysis.ats_score)}`}
                    >
                      {analysis.ats_score}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">ATS Score</div>
                    <div
                      className={`text-xs font-semibold mt-1 capitalize ${scoreColor(analysis.ats_score)}`}
                    >
                      {analysis.quality_label}
                    </div>
                  </div>

                  {matchResult && (
                    <div
                      className={`border rounded-2xl p-6 text-center ${scoreBg(matchResult.match_score)}`}
                    >
                      <div
                        className={`text-5xl font-black ${scoreColor(matchResult.match_score)}`}
                      >
                        {matchResult.match_score}%
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Job Match
                      </div>
                      <div
                        className={`text-xs font-semibold mt-1 capitalize ${scoreColor(matchResult.match_score)}`}
                      >
                        {matchResult.match_level}
                      </div>
                    </div>
                  )}

                  <div className="border border-gray-800 rounded-2xl p-6 text-center">
                    <div className="text-5xl font-black text-blue-400">
                      {analysis.section_stats.total_sections}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">Sections</div>
                  </div>

                  <div className="border border-gray-800 rounded-2xl p-6 text-center">
                    <div className="text-5xl font-black text-purple-400">
                      {analysis.llm_skills.skills.technical.length +
                        analysis.llm_skills.skills.tools.length}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Skills Found
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-800 pb-2">
                  {["overview", "skills", "feedback", "improve"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                        activeTab === tab
                          ? "bg-emerald-500 text-black"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="bg-gray-900 rounded-2xl p-6 min-h-48">
                  {activeTab === "overview" && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-lg">Resume Overview</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">File</span>
                          <span>{analysis.file_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Word Count</span>
                          <span>{analysis.word_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Experience</span>
                          <span>
                            {analysis.llm_skills.experience_years} years
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Job Titles</span>
                          <span className="text-right text-xs">
                            {analysis.llm_skills.job_titles
                              .slice(0, 2)
                              .join(", ")}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-300 mb-2">
                          Sections Found:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.section_stats.sections_found.map((s) => (
                            <span
                              key={s}
                              className="bg-gray-800 text-xs px-3 py-1 rounded-full capitalize"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "skills" && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg">Skills Analysis</h3>
                      {[
                        {
                          label: "Technical",
                          skills: analysis.llm_skills.skills.technical,
                          color: "bg-blue-500/20 text-blue-300",
                        },
                        {
                          label: "Tools",
                          skills: analysis.llm_skills.skills.tools,
                          color: "bg-purple-500/20 text-purple-300",
                        },
                        {
                          label: "Soft Skills",
                          skills: analysis.llm_skills.skills.soft,
                          color: "bg-emerald-500/20 text-emerald-300",
                        },
                      ].map(
                        ({ label, skills, color }) =>
                          skills.length > 0 && (
                            <div key={label}>
                              <p className="text-sm font-semibold text-gray-400 mb-2">
                                {label}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {skills.map((skill) => (
                                  <span
                                    key={skill}
                                    className={`text-xs px-3 py-1 rounded-full ${color}`}
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )
                      )}
                    </div>
                  )}

                  {activeTab === "feedback" && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg">ATS Feedback</h3>
                      <div>
                        <p className="text-sm font-semibold text-emerald-400 mb-2">
                          ✅ Strengths
                        </p>
                        <ul className="space-y-1">
                          {analysis.llm_feedback.ats_feedback.strengths.map(
                            (s, i) => (
                              <li key={i} className="text-sm text-gray-300">
                                • {s}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-400 mb-2">
                          ❌ Weaknesses
                        </p>
                        <ul className="space-y-1">
                          {analysis.llm_feedback.ats_feedback.weaknesses.map(
                            (w, i) => (
                              <li key={i} className="text-sm text-gray-300">
                                • {w}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300">
                        {
                          analysis.llm_feedback.ats_feedback
                            .overall_assessment
                        }
                      </div>
                    </div>
                  )}

                  {activeTab === "improve" && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg">
                        Improvement Suggestions
                      </h3>
                      <div>
                        <p className="text-sm font-semibold text-yellow-400 mb-2">
                          💡 Suggestions
                        </p>
                        <ul className="space-y-2">
                          {analysis.llm_skills.improvement_suggestions.map(
                            (s, i) => (
                              <li
                                key={i}
                                className="text-sm text-gray-300 bg-gray-800 rounded-lg p-3"
                              >
                                {i + 1}. {s}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-400 mb-2">
                          🔑 Keywords to Add
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.llm_feedback.ats_feedback.keyword_suggestions.map(
                            (k) => (
                              <span
                                key={k}
                                className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full"
                              >
                                + {k}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      {analysis.llm_feedback.rewrite_suggestions.summary && (
                        <div>
                          <p className="text-sm font-semibold text-purple-400 mb-2">
                            ✍️ Rewritten Summary
                          </p>
                          <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300 italic">
                            {
                              analysis.llm_feedback.rewrite_suggestions
                                .summary
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}