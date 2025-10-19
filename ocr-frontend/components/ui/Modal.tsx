"use client";

import React, { useEffect } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, className = "" }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative z-10 w-[95%] sm:w-[560px] max-w-[95vw] rounded-xl border border-blue-900/60 bg-blue-950/80 backdrop-blur p-4 sm:p-6 shadow-2xl ${className}`}>
        {title && (
          <div className="mb-4 pb-3 border-b border-blue-900/60">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
        )}
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 text-blue-200 hover:text-white px-2 py-1 rounded"
        >
          ✕
        </button>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
