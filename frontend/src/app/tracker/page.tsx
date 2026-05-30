"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface JobApplication {
  id: string;
  company_name: string;
  job_title: string;
  job_url: string;
  status: string;
  applied_date: string;
  notes: string;
  salary_range: string;
  location: string;
  follow_up_date: string;
}

const STATUS_OPTIONS = [
  { value: "applied", label: "Applied", color: "bg-blue-500/20 text-blue-400" },
  { value: "screening", label: "Screening", color: "bg-yellow-500/20 text-yellow-400" },
  { value: "interview", label: "Interview", color: "bg-purple-500/20 text-purple-400" },
  { value: "offer", label: "Offer", color: "bg-emerald-500/20 text-emerald-400" },
  { value: "rejected", label: "Rejected", color: "bg-red-500/20 text-red-400" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-gray-500/20 text-gray-400" },
];

const EMPTY_FORM = {
  company_name: "",
  job_title: "",
  job_url: "",
  status: "applied",
  applied_date: new Date().toISOString().split("T")[0],
  notes: "",
  salary_range: "",
  location: "",
  follow_up_date: "",
};

export default function TrackerPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState("all");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth");
      return;
    }
    fetchApplications();
  };

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setApplications(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.company_name || !form.job_title) {
      toast.error("Company and job title are required");
      return;
    }
    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      if (editId) {
        const { error } = await supabase
          .from("job_applications")
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", editId);
        if (error) throw error;
        toast.success("Application updated!");
      } else {
        const { error } = await supabase
          .from("job_applications")
          .insert({ ...form, user_id: session.user.id });
        if (error) throw error;
        toast.success("Application added!");
      }

      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      fetchApplications();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this application?")) return;
    const { error } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", id);
    if (!error) {
      toast.success("Deleted!");
      fetchApplications();
    }
  };

  const handleEdit = (app: JobApplication) => {
    setForm({
      company_name: app.company_name,
      job_title: app.job_title,
      job_url: app.job_url || "",
      status: app.status,
      applied_date: app.applied_date,
      notes: app.notes || "",
      salary_range: app.salary_range || "",
      location: app.location || "",
      follow_up_date: app.follow_up_date || "",
    });
    setEditId(app.id);
    setShowForm(true);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase
      .from("job_applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    fetchApplications();
  };

  const getStatusStyle = (status: string) => {
    return (
      STATUS_OPTIONS.find((s) => s.value === status)?.color ||
      "bg-gray-500/20 text-gray-400"
    );
  };

  const filtered =
    filterStatus === "all"
      ? applications
      : applications.filter((a) => a.status === filterStatus);

  const stats = {
    total: applications.length,
    interview: applications.filter((a) => a.status === "interview").length,
    offer: applications.filter((a) => a.status === "offer").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-black">
              R
            </div>
            <span className="text-xl font-bold">ResumeVibe</span>
          </Link>
          <div className="flex gap-4 text-sm">
            <Link
              href="/analyze"
              className="text-gray-400 hover:text-white transition"
            >
              Analyze
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white transition"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black mb-1">
              Job Application Tracker
            </h1>
            <p className="text-gray-400">
              Track all your job applications in one place
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditId(null);
              setForm(EMPTY_FORM);
            }}
            className="bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-emerald-400 transition"
          >
            + Add Application
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Applied", value: stats.total, color: "text-white" },
            {
              label: "Interviews",
              value: stats.interview,
              color: "text-purple-400",
            },
            {
              label: "Offers",
              value: stats.offer,
              color: "text-emerald-400",
            },
            {
              label: "Rejected",
              value: stats.rejected,
              color: "text-red-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center"
            >
              <div className={`text-4xl font-black ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filterStatus === "all"
                ? "bg-emerald-500 text-black"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            All ({applications.length})
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                filterStatus === s.value
                  ? "bg-emerald-500 text-black"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {s.label} ({applications.filter((a) => a.status === s.value).length})
            </button>
          ))}
        </div>

        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
            <h3 className="font-bold text-lg mb-4">
              {editId ? "Edit Application" : "Add New Application"}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) =>
                    setForm({ ...form, company_name: e.target.value })
                  }
                  placeholder="e.g. Google"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={form.job_title}
                  onChange={(e) =>
                    setForm({ ...form, job_title: e.target.value })
                  }
                  placeholder="e.g. Software Engineer"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Job URL
                </label>
                <input
                  type="text"
                  value={form.job_url}
                  onChange={(e) =>
                    setForm({ ...form, job_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Applied Date
                </label>
                <input
                  type="date"
                  value={form.applied_date}
                  onChange={(e) =>
                    setForm({ ...form, applied_date: e.target.value })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Follow Up Date
                </label>
                <input
                  type="date"
                  value={form.follow_up_date}
                  onChange={(e) =>
                    setForm({ ...form, follow_up_date: e.target.value })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Salary Range
                </label>
                <input
                  type="text"
                  value={form.salary_range}
                  onChange={(e) =>
                    setForm({ ...form, salary_range: e.target.value })
                  }
                  placeholder="e.g. $80k-$100k"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="e.g. Remote, Dhaka"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  placeholder="Interview notes, contacts, etc..."
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-500 text-black px-6 py-2 rounded-xl font-bold hover:bg-emerald-400 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : editId ? "Update" : "Add Application"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                }}
                className="bg-gray-700 text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-emerald-400 animate-pulse">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">No applications yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-emerald-500 text-black px-6 py-2 rounded-xl font-bold hover:bg-emerald-400 transition"
            >
              Add Your First Application
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <div
                key={app.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-600 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-white">{app.job_title}</h3>
                      <span className="text-gray-400">at</span>
                      <span className="text-emerald-400 font-semibold">
                        {app.company_name}
                      </span>
                      {app.job_url && (
                        <a
                          href={app.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          View Job
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {app.location && <span>Location: {app.location}</span>}
                      {app.salary_range && (
                        <span>Salary: {app.salary_range}</span>
                      )}
                      <span>Applied: {app.applied_date}</span>
                      {app.follow_up_date && (
                        <span className="text-yellow-400">
                          Follow up: {app.follow_up_date}
                        </span>
                      )}
                    </div>
                    {app.notes && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-1">
                        Notes: {app.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <select
                      value={app.status}
                      onChange={(e) =>
                        handleStatusChange(app.id, e.target.value)
                      }
                      className={`text-xs px-3 py-1 rounded-full font-semibold border-0 cursor-pointer ${getStatusStyle(app.status)}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleEdit(app)}
                      className="text-xs text-gray-500 hover:text-white transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="text-xs text-gray-500 hover:text-red-400 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}