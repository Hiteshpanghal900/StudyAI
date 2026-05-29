"use client";

import { useCallback } from "react";

import { useDropzone } from "react-dropzone";

import {
  FileUp,
  Loader2,
  Upload,
  X,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  isUploading: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  onError?: (message: string) => void;
};

export default function UploadModal({
  isOpen,
  isUploading,
  onClose,
  onUpload,
  onError,
}: Props) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      if (file && !isUploading) {
        onUpload(file);
      }
    },
    [isUploading, onUpload]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
  } = useDropzone({
    onDrop,
    onDropRejected: () => {
      onError?.("Please upload a PDF file.");
    },
    disabled: isUploading,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

      <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-cyan-800/40 bg-zinc-950/95 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-6 accent-ring">

        <button
          onClick={() => {
            if (!isUploading) onClose();
          }}
          disabled={isUploading}
          className="absolute right-4 top-4 rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X size={18} />
        </button>

        <div className="mb-6 pr-8">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 via-emerald-300 to-amber-300 text-zinc-950 brand-glow">
            <FileUp size={20} />
          </div>

          <h2 className="text-xl font-semibold text-zinc-100">
            Upload PDF
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Add a document to index it for grounded answers.
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition sm:min-h-64 sm:p-12

          ${
            isUploading
              ? "cursor-wait border-zinc-700 bg-zinc-900/70"
              : isDragActive
                ? "cursor-pointer border-cyan-300 bg-cyan-950/30"
                : "cursor-pointer border-cyan-800/40 bg-zinc-900/50 hover:border-cyan-400/70 hover:bg-cyan-950/20"
          }`}
        >
          <input {...getInputProps()} />

          {isUploading ? (
            <Loader2
              size={38}
              className="mb-4 animate-spin text-cyan-300"
            />
          ) : (
            <Upload
              size={38}
              className="mb-4 text-cyan-300"
            />
          )}

          <p className="text-base font-medium text-zinc-100">
            {isUploading
              ? "Indexing document..."
              : isDragActive
              ? "Drop PDF here"
              : "Drag and drop a PDF"}
          </p>

          <p className="mt-2 max-w-xs text-sm text-zinc-500">
            {isUploading
              ? "This usually takes a moment while the document is embedded."
              : "or click to browse your files"}
          </p>
        </div>

      </div>
    </div>
  );
}
