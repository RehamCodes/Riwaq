"use client";

import { useEffect } from "react";
import { IconButton } from "./Button";
import { X } from "lucide-react";

export function Modal({
  label,
  onClose,
  children,
  className = "",
}: {
  // Accessible name of the dialog.
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`w-full max-w-md rounded-2xl bg-white p-5 text-sm text-slate-700 shadow-xl ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

// Title row with a close button. Pass `leading` for e.g. a color marker.
export function ModalHeader({
  title,
  onClose,
  leading,
}: {
  title: string;
  onClose: () => void;
  leading?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {leading}
      <h2 className="flex-1 text-lg font-semibold text-slate-800">{title}</h2>
      <CloseButton onClose={onClose} />
    </div>
  );
}

export function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <IconButton label="Close" onClick={onClose}>
      <X className="size-5" />
    </IconButton>
  );
}
