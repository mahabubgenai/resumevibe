"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface MonthPlan {
  month: string;
  focus: string;
  skills_to_learn: string[];
  resources: string[];
  milestone: string;
}

interface RoadmapData {
  readiness_score: number;
  readiness_label: string;
  skills_you_have: string[];
  critical_skills_missing: string[];
  nice_to_have_skills: string[];
  monthly_plan: MonthPlan[];
  certifications: string[];
  projects_to_build: string[];
  estimated_salary: string;
}

interface Props {
  skills: string[];
}

const TIMELINE_OPTIONS = [
  "3 months",
  "6 months",
  "1 year",
  "2 years",
];

export default function SkillRoadmap({ skills }: Props) {
  const [targetRole, setTargetRole] = useState("");
  const [timeline, setTimeline] = useState("6 months");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RoadmapData | null>(null);
  const [activeMonth, setActiveMonth] = useState(0);

  const handleGenerate = async () => {
    if (!targetRole.trim()) {
      toast.error("Please enter a target role");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/resume/skill-roadmap`,
        {
          current_skills: skills,
          target_role: targetRole,
          timeline: timeline,
        }
      );
      setData(response.data.roadmap);
      toast.success("Skill roadmap generated!");
    } catch {
      toast.error("Failed to generate. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const readinessColor = (score: number) => {
    if (score >= 70) return "text-emerald-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  if (!data) {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Skill Roadmap</h3>
        <p className="text-gray-400 text-sm">
          Enter your target role and get a personalized month-by-month
          skill development plan.
        </p>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Target Role
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Data Scientist, DevOps Engineer, ML Engineer"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Timeline
          </label>
          <div className="flex gap-2 flex-wrap">
            {TIMELINE_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setTimeline(t)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  timeline === t
                    ? "bg-emerald-500 text-black"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2">
            Your current skills ({skills.length}):
          </p>
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 8).map((s) => (
              <span
                key={s}
                className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full"
              >
                {s}
              </span>
            ))}
            {skills.length > 8 && (
              <span className="text-xs text-gray-500">
                +{skills.length - 8} more
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={!targetRole.trim() || loading}
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
              Generating Roadmap...
            </span>
          ) : (
            "Generate Skill Roadmap →"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Skill Roadmap</h3>
        <button
          onClick={() => setData(null)}
          className="text-xs text-gray-500 hover:text-white transition"
        >
          Regenerate
        </button>
      </div>

      {/* Readiness + Salary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Current Readiness</p>
          <p className={`text-4xl font-black ${readinessColor(data.readiness_score)}`}>
            {data.readiness_score}%
          </p>
          <p className="text-xs text-gray-500 mt-1">{data.readiness_label}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Estimated Salary</p>
          <p className="text-lg font-black text-emerald-400">
            {data.estimated_salary}
          </p>
          <p className="text-xs text-gray-500 mt-1">after transition</p>
        </div>
      </div>

      {/* Skills */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-xl p-3">
          <p className="text-xs font-semibold text-emerald-400 mb-2">
            You Already Have
          </p>
          <div className="flex flex-wrap gap-1">
            {data.skills_you_have.slice(0, 6).map((s) => (
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
          <p className="text-xs font-semibold text-red-400 mb-2">
            Critical Missing
          </p>
          <div className="flex flex-wrap gap-1">
            {data.critical_skills_missing.slice(0, 6).map((s) => (
              <span
                key={s}
                className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Plan */}
      <div>
        <p className="text-xs font-semibold text-gray-400 mb-2">
          Monthly Plan
        </p>
        <div className="flex gap-2 flex-wrap mb-3">
          {data.monthly_plan.map((plan, i) => (
            <button
              key={i}
              onClick={() => setActiveMonth(i)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeMonth === i
                  ? "bg-emerald-500 text-black"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {plan.month}
            </button>
          ))}
        </div>

        {data.monthly_plan[activeMonth] && (
          <div className="bg-gray-800 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-emerald-400">Focus:</p>
              <p className="text-sm text-white">
                {data.monthly_plan[activeMonth].focus}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-400 mb-1">
                Skills to Learn:
              </p>
              <div className="flex flex-wrap gap-1">
                {data.monthly_plan[activeMonth].skills_to_learn.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-400 mb-1">
                Resources:
              </p>
              <ul className="space-y-1">
                {data.monthly_plan[activeMonth].resources.map((r, i) => (
                  <li key={i} className="text-xs text-gray-300 flex gap-2">
                    <span className="text-purple-400">→</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
              <p className="text-xs text-yellow-400">
                Milestone: {data.monthly_plan[activeMonth].milestone}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Projects */}
      {data.projects_to_build?.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-orange-400 mb-2">
            Portfolio Projects to Build:
          </p>
          <ul className="space-y-1">
            {data.projects_to_build.map((p, i) => (
              <li key={i} className="text-xs text-gray-300 flex gap-2">
                <span className="text-orange-400">{i + 1}.</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Certifications */}
      {data.certifications?.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-yellow-400 mb-2">
            Recommended Certifications:
          </p>
          <div className="flex flex-wrap gap-1">
            {data.certifications.map((c) => (
              <span
                key={c}
                className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}