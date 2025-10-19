import axios from "axios";
import type { VerificationResult, UploadItem } from "./types";

const baseURL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export const api = axios.create({ baseURL });

export async function uploadDocument(file: File): Promise<UploadItem> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<UploadItem>("/api/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function verifyDocument(uploadId: string): Promise<VerificationResult> {
  const { data } = await api.post<VerificationResult>(`/api/verify`, { id: uploadId });
  return data;
}

export async function listResults(): Promise<VerificationResult[]> {
  const { data } = await api.get<VerificationResult[]>("/api/results");
  return data;
}

export async function getResult(id: string): Promise<VerificationResult> {
  const { data } = await api.get<VerificationResult>(`/api/results/${id}`);
  return data;
}
