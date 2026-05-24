"use client";

import { useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Job {
  title: string;
  url: string;
  description: string;
  source: string;
  searched_for: string;
}

interface Props {
  jobTitles: string[];
  skills: string[];
}

export default function JobSuggestions({ jobTitles, skills }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState("Remote");
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/jobs/search`, {
        job_titles: jobTitles,
        skills: skills,
        location: location,
      });
      setJobs(response.data.jobs);
      setSearched(true);
    } catch (err) {
      console.error("Job search failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="font-bold text-lg mb-4">Job Suggestions</h3>
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (e.g. Remote, Dhaka)"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-emerald-500 text-black px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-400 transition disabled:opacity-50"
        >
          {loading ? "Searching..." : "Find Jobs"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {jobTitles.slice(0, 3).map((title) => (
          <span
            key={title}
            className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full"
          >
            {title}
          </span>
        ))}
        {skills.slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>
      {!searched ? (
        <div className="text-center py-8 text-gray-600">
          <p className="text-sm">
            Click &quot;Find Jobs&quot; to search relevant job listings
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <a
              key={i}
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl p-4 transition"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm text-white line-clamp-1">
                  {job.title}
                </h4>
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                  {job.source}
                </span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2">
                {job.description}
              </p>
              <div className="mt-2">
                <span className="text-xs text-emerald-400">
                  View Job Listing
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}