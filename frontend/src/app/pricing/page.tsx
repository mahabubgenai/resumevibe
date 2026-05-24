"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      const response = await axios.post(`${API_URL}/api/payments/checkout`, {
        user_id: session.user.id,
        email: session.user.email,
      });

      window.location.href = response.data.url;
    } catch {
      toast.error("Failed to create checkout session");
    } finally {
      setLoading(false);
    }
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
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-black mb-4">Simple Pricing</h1>
        <p className="text-gray-400 text-xl mb-16">
          Start free, upgrade when you need more
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-left">
            <div className="text-gray-400 text-sm font-semibold mb-2">FREE</div>
            <div className="text-5xl font-black mb-1">$0</div>
            <div className="text-gray-400 mb-8">Forever free</div>
            <ul className="space-y-3 mb-8">
              {[
                "3 resume analyses/month",
                "ATS score & feedback",
                "Skill extraction",
                "Basic improvements",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-gray-300">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/analyze"
              className="block w-full text-center border border-gray-700 py-3 rounded-xl font-bold hover:border-gray-500 transition"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-gray-900 border-2 border-emerald-500 rounded-2xl p-8 text-left relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-black px-4 py-1 rounded-full">
              MOST POPULAR
            </div>
            <div className="text-emerald-400 text-sm font-semibold mb-2">PRO</div>
            <div className="text-5xl font-black mb-1">$9.99</div>
            <div className="text-gray-400 mb-8">per month</div>
            <ul className="space-y-3 mb-8">
              {[
                "Unlimited analyses",
                "LangGraph AI pipeline",
                "Job match scoring",
                "Resume rewriting",
                "Resume history",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-gray-300">{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-emerald-500 text-black py-3 rounded-xl font-bold hover:bg-emerald-400 transition disabled:opacity-50"
            >
              {loading ? "Loading..." : "Upgrade to Pro →"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}