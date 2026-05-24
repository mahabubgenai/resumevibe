import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-black">
              R
            </div>
            <span className="text-xl font-bold">ResumeVibe</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/auth"
              className="text-gray-400 hover:text-white transition"
            >
              Login
            </Link>
            <Link
              href="/analyze"
              className="bg-emerald-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-emerald-400 transition"
            >
              Try Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 text-emerald-400 text-sm mb-8">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          AI-Powered Resume Analysis
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
          Get Your Resume
          <span className="text-emerald-400"> ATS-Ready</span>
          <br />
          in Seconds
        </h1>

        <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto">
          Upload your resume and get instant AI feedback, ATS score,
          skill analysis, and job match scoring powered by LLaMA 3.3 70B.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/analyze"
            className="bg-emerald-500 text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-400 transition"
          >
            Analyze My Resume →
          </Link>
          <Link
            href="#features"
            className="border border-gray-700 px-8 py-4 rounded-xl font-bold text-lg hover:border-gray-500 transition"
          >
            See Features
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-16">
          Everything You Need
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "📊",
              title: "ATS Score",
              desc: "Get instant ATS compatibility score with detailed breakdown",
              color: "emerald",
            },
            {
              icon: "🧠",
              title: "AI Skill Extraction",
              desc: "LLaMA 3.3 70B extracts all skills across any profession",
              color: "blue",
            },
            {
              icon: "🎯",
              title: "Job Matching",
              desc: "Semantic similarity matching against job descriptions",
              color: "purple",
            },
            {
              icon: "✍️",
              title: "Resume Rewriting",
              desc: "AI rewrites weak bullet points into powerful statements",
              color: "orange",
            },
            {
              icon: "📈",
              title: "Improvement Tips",
              desc: "Actionable suggestions to improve your resume score",
              color: "pink",
            },
            {
              icon: "⚡",
              title: "Instant Analysis",
              desc: "Get complete analysis in under 10 seconds",
              color: "yellow",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500">
        <p>Built by Mahabub — ResumeVibe AI Platform 2025</p>
      </footer>
    </main>
  );
}