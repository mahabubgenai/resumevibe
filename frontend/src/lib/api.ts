import axios from "axios";
import { ResumeAnalysis, JobMatch } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
});

export async function analyzeResume(file: File): Promise<ResumeAnalysis> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/api/resume/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function scoreResume(file: File): Promise<ResumeAnalysis> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/api/resume/score", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function matchJob(
  file: File,
  jobDescription: string
): Promise<JobMatch> {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("job_description", jobDescription);

  const response = await api.post("/api/resume/match", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}