"use client";
import { useState } from "react";
import { uploadDocument, verifyDocument } from "../lib/api";
import { useUploadsStore } from "../store/useUploadsStore";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Sparkles
} from "lucide-react";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addUpload = useUploadsStore((s) => s.addUpload);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(selectedFile.type)) {
      setError("Invalid file type. Please upload PDF or image files only.");
      return;
    }

    if (selectedFile.size > maxSize) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-8 h-8" />;
    if (file.type === 'application/pdf') return <FileText className="w-8 h-8 text-red-500" />;
    return <ImageIcon className="w-8 h-8 text-blue-500" />;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    
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
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              AI-Powered Verification
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Upload Document for Verification
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Upload invoices, bills of lading, or customs declarations
          </p>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
            dragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 scale-[1.02]"
              : file
              ? "border-green-500 bg-green-50 dark:bg-green-500/10"
              : error
              ? "border-red-500 bg-red-50 dark:bg-red-500/10"
              : "border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500"
          }`}
        >
          <div className="p-8">
            {!file ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className={`p-4 rounded-full transition-all ${
                    dragActive 
                      ? "bg-blue-500 text-white scale-110" 
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  }`}>
                    <Upload className="w-8 h-8" />
                  </div>
                </div>

                <div>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300">
                      Click to upload
                    </span>
                    <span className="text-gray-600 dark:text-gray-400"> or drag and drop</span>
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    PDF, PNG, JPG, GIF or WEBP (max. 10MB)
                  </p>
                </div>

                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getFileIcon()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={loading}
                  className="flex-shrink-0 p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5 text-red-500" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-400">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Features List */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Secure</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Encrypted upload</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Fast</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Instant processing</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Smart</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered OCR</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!file || loading}
          className="relative w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none group overflow-hidden"
        >
          {loading && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
          )}
          <span className="relative flex items-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Upload & Verify Document
              </>
            )}
          </span>
        </button>

        {/* Info Text */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Your document will be processed through AI-powered OCR and verified against ZRA systems. 
          Results will be recorded on blockchain for immutable proof.
        </p>
      </form>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}