"use client";
import { create } from "zustand";
import type { UploadItem, VerificationResult } from "../lib/types";

interface State {
  uploads: UploadItem[];
  results: VerificationResult[];
  addUpload: (u: UploadItem) => void;
  setResults: (r: VerificationResult[]) => void;
  upsertResult: (r: VerificationResult) => void;
}

export const useUploadsStore = create<State>((set) => ({
  uploads: [],
  results: [],
  addUpload: (u) => set((s) => ({ uploads: [u, ...s.uploads] })),
  setResults: (r) => set(() => ({ results: r })),
  upsertResult: (r) =>
    set((s) => ({
      results: [r, ...s.results.filter((x) => x.id !== r.id)],
      uploads: s.uploads.map((u) => (u.resultId === r.id ? { ...u, riskLevel: r.riskLevel, riskScore: r.riskScore, status: "completed" } : u)),
    })),
}));
