"use client";
import { useState } from "react";
import { uploadDocument, verifyDocument } from "../lib/api";
import { useUploadsStore } from "../store/useUploadsStore";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const addUpload = useUploadsStore((s) => s.addUpload);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const uploaded = await uploadDocument(file);
      addUpload(uploaded);
      // Kick off verification flow
      if (uploaded.id) {
        await verifyDocument(uploaded.id);
      }
      setFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 p-4 border rounded-md bg-white/70 dark:bg-neutral-900/50">
      <label className="text-sm font-medium">Upload document (PDF/Image)</label>
      <input
        type="file"
        accept=".pdf,image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer"
      />
      <button
        type="submit"
        disabled={!file || loading}
        className="inline-flex items-center justify-center h-10 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload & Verify"}
      </button>
    </form>
  );
}
