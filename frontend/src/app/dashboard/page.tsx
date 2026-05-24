"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface Analysis {
  id: string;
  file_name: string;
  ats_score: number;
  quality_label: string;
  match_score: number | null;
  created_at: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }
      setUser({ email: session.user.email || "" });

      // Load resume history
      const { data, error } = await supabase
        .from("resume_analyses")
        .select("id, file_name, ats_score, quality_label, match_score, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) setAnalyses(data);
      setLoading(false);
    };
    getUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out!");
    router.push("/");
  };

  const scoreColor = (score: number) => {
    if (score >= 86) return "text-emerald-400";
    if (score >= 71) return "text-blue-400";
    if (score >= 41) return "text-yellow-400";
    return "text-red-400";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-emerald-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

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
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white text-sm transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black">Dashboard</h1>
            <p className="text-gray-400 mt-1">Your resume analysis history</p>
          </div>
          <Link
            href="/analyze"
            className="bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-emerald-400 transition"
          >
            + Analyze Resume
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total Analyses",
              value: analyses.length,
              color: "text-emerald-400",
            },
            {
              label: "Avg ATS Score",
              value: analyses.length
                ? Math.round(
                    analyses.reduce((a, b) => a + b.ats_score, 0) /
                      analyses.length
                  )
                : 0,
              color: "text-blue-400",
            },
            {
              label: "Best Score",
              value: analyses.length
                ? Math.max(...analyses.map((a) => a.ats_score))
                : 0,
              color: "text-purple-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center"
            >
              <div className={`text-4xl font-black ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* History Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-bold text-lg">Resume History</h2>
          </div>

          {analyses.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-5xl mb-4">📄</div>
              <p className="text-gray-400">No analyses yet</p>
              <Link
                href="/analyze"
                className="inline-block mt-4 bg-emerald-500 text-black px-6 py-2 rounded-lg font-bold hover:bg-emerald-400 transition"
              >
                Analyze Your First Resume
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">📄</div>
                    <div>
                      <p className="font-semibold">{analysis.file_name}</p>
                      <p className="text-gray-500 text-xs">
                        {formatDate(analysis.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className={`font-black text-xl ${scoreColor(analysis.ats_score)}`}>
                        {analysis.ats_score}
                      </div>
                      <div className="text-gray-500 text-xs">ATS</div>
                    </div>
                    {analysis.match_score && (
                      <div className="text-center">
                        <div className={`font-black text-xl ${scoreColor(analysis.match_score)}`}>
                          {analysis.match_score}%
                        </div>
                        <div className="text-gray-500 text-xs">Match</div>
                      </div>
                    )}
                    <span
                      className={`text-xs px-3 py-1 rounded-full capitalize font-semibold ${
                        analysis.quality_label === "excellent"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : analysis.quality_label === "good"
                          ? "bg-blue-500/20 text-blue-400"
                          : analysis.quality_label === "average"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {analysis.quality_label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}