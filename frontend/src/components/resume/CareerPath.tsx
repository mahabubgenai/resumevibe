"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CareerPathItem {
  title: string;
  type: string;
  timeline: string;
  match_percentage: number;
  required_skills: string[];
  skills_you_have: string[];
  skills_to_learn: string[];
  salary_range: string;
  why_good_fit: string;
  action_steps: string[];
}

interface LearningResource {
  skill: string;
  resource: string;
  type: string;
}

interface CareerData {
  current_level: string;
  current_role_assessment: string;
  career_paths: CareerPathItem[];
  top_recommendation: string;
  immediate_actions: string[];
  learning_resources: LearningResource[];
}

interface Props {
  file: File | null;
}

export default function CareerPath({ file }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CareerData | null>(null);
  const [activePathIndex, setActivePathIndex] = useState(0);

  const handleGenerate = async () => {
    if (!file) {
      toast.error("Please upload a resume first");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${API_URL}/api/resume/career-path`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setData(response.data.career_paths);
      toast.success("Career paths generated!");
    } catch {
      toast.error("Failed to generate. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const typeColor = (type: string) => {
    if (type === "promotion") return "bg-emerald-500/20 text-emerald-400";
    if (type === "pivot") return "bg-purple-500/20 text-purple-400";
    return "bg-blue-500/20 text-blue-400";
  };

  const matchColor = (pct: number) => {
    if (pct >= 80) return "text-emerald-400";
    if (pct >= 60) return "text-blue-400";
    if (pct >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  if (!data) {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Career Path Suggester</h3>
        <p className="text-gray-400 text-sm">
          AI will analyze your skills and suggest realistic next career moves
          with required skills and action steps.
        </p>
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
              Analyzing Career Paths...
            </span>
          ) : (
            "Suggest Career Paths →"
          )}
        </button>
      </div>
    );
  }

  const activePath = data.career_paths?.[activePathIndex];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Career Path Suggester</h3>
        <button
          onClick={() => setData(null)}
          className="text-xs text-gray-500 hover:text-white transition"
        >
          Regenerate
        </button>
      </div>

      {/* Current Level */}
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 mb-1">
          Current Level
        </p>
        <p className="text-sm font-bold text-emerald-400">
          {data.current_level}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {data.current_role_assessment}
        </p>
      </div>

      {/* Top Recommendation */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-emerald-400 mb-1">
          Top Recommendation
        </p>
        <p className="text-sm text-gray-300">{data.top_recommendation}</p>
      </div>

      {/* Career Path Tabs */}
      <div className="flex gap-2">
        {data.career_paths?.map((path, i) => (
          <button
            key={i}
            onClick={() => setActivePathIndex(i)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition ${
              activePathIndex === i
                ? "bg-emerald-500 text-black"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {path.title.split(" ").slice(0, 2).join(" ")}
          </button>
        ))}
      </div>

      {/* Active Path Details */}
      {activePath && (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {/* Header */}
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-white">{activePath.title}</h4>
              <span
                className={`text-xl font-black ${matchColor(activePath.match_percentage)}`}
              >
                {activePath.match_percentage}%
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span
                className={`text-xs px-2 py-1 rounded-full capitalize ${typeColor(activePath.type)}`}
              >
                {activePath.type}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                {activePath.timeline}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                {activePath.salary_range}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">{activePath.why_good_fit}</p>
          </div>

          {/* Skills */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-xs font-semibold text-emerald-400 mb-2">
                Skills You Have
              </p>
              <div className="flex flex-wrap gap-1">
                {activePath.skills_you_have.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-xs font-semibold text-yellow-400 mb-2">
                Skills to Learn
              </p>
              <div className="flex flex-wrap gap-1">
                {activePath.skills_to_learn.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Steps */}
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-400 mb-2">
              Action Steps
            </p>
            <ul className="space-y-1">
              {activePath.action_steps.map((step, i) => (
                <li key={i} className="text-xs text-gray-300 flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* Learning Resources */}
          {data.learning_resources?.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-400 mb-2">
                Learning Resources
              </p>
              <ul className="space-y-2">
                {data.learning_resources.map((r, i) => (
                  <li key={i} className="text-xs text-gray-300 flex gap-2">
                    <span className="text-purple-400 flex-shrink-0">→</span>
                    <span>
                      <span className="text-white font-semibold">
                        {r.skill}:
                      </span>{" "}
                      {r.resource}
                      <span className="ml-1 text-gray-500">({r.type})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Immediate Actions */}
          {data.immediate_actions?.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-yellow-400 mb-2">
                Do This Week
              </p>
              <ul className="space-y-1">
                {data.immediate_actions.map((action, i) => (
                  <li key={i} className="text-xs text-gray-300 flex gap-2">
                    <span className="text-yellow-400 flex-shrink-0">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}