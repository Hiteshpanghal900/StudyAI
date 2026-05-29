"use client";

import { useState } from "react";

import {
  FileText,
  Plus,
  Loader2,
  LibraryBig,
  Trash2,
} from "lucide-react";

import UploadModal from "./UploadModal";

import { DocumentType } from "@/app/page";
import { apiUrl } from "@/lib/api";

type Props = {
  documents: DocumentType[];
  setDocuments: React.Dispatch<
    React.SetStateAction<DocumentType[]>
  >;
  selectedDocument: DocumentType | null;
  setSelectedDocument: (
    doc: DocumentType | null
  ) => void;
  className?: string;
  onError?: (message: string) => void;
};

export default function Sidebar({
  documents,
  setDocuments,
  selectedDocument,
  setSelectedDocument,
  className = "",
  onError,
}: Props) {
  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [isUploading, setIsUploading] =
    useState(false);

  async function handleFileUpload(file: File) {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(apiUrl("/upload"), {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to upload PDF");
      }

      if (!data?.document_id) {
        throw new Error("Upload response did not include a document id");
      }

      const newDoc = {
        id: data.document_id,
        name: data.name || file.name,
        file,
        url: data.url || URL.createObjectURL(file),
      };
      console.log(data.document_id)

      setDocuments((prev) => [...prev, newDoc]);

      setSelectedDocument(newDoc);

      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      onError?.(
        error instanceof Error
          ? error.message
          : "Failed to upload PDF"
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(docId: string) {
    if (confirm("Are you sure you want to delete this document and all its embeddings?")) {
      try {
        const response = await fetch(apiUrl(`/documents/${docId}`), {
          method: "DELETE",
        });
        if (response.ok) {
          // Remove from local documents list
          setDocuments((prev) => prev.filter((d) => d.id !== docId));
          // If the deleted document was selected, clear selected document
          if (selectedDocument?.id === docId) {
            setSelectedDocument(null);
          }
        } else {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || data?.detail || "Failed to delete document");
        }
      } catch (error) {
        console.error("Error deleting document:", error);
        onError?.(
          error instanceof Error
            ? error.message
            : "Failed to delete document"
        );
      }
    }
  }

  return (
    <>
      <aside className={`flex w-72 flex-col border-r border-cyan-900/30 bg-zinc-950/80 p-4 backdrop-blur-xl surface-glow ${className}`}>

        {/* Logo */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 via-emerald-300 to-amber-300 text-zinc-950 brand-glow">
            <LibraryBig size={20} />
          </div>

          <div>
            <h1 className="text-lg font-semibold text-zinc-100">
              StudyAI
            </h1>

            <p className="text-xs text-zinc-500">
              Document intelligence
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isUploading}
          className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-cyan-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:from-zinc-700 disabled:via-zinc-700 disabled:to-zinc-700 disabled:text-zinc-400"
        >
          {isUploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          {isUploading ? "Indexing..." : "Upload PDF"}
        </button>

        {/* Upload Animation */}
        {isUploading && (
          <div className="mt-4 rounded-lg border border-cyan-800/40 bg-cyan-950/20 p-3 accent-ring">
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <Loader2
                size={16}
                className="animate-spin"
              />

              Indexing document...
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" />
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="mt-8 flex flex-col gap-2 overflow-auto">

          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Documents
            </p>

            <span className="rounded-full border border-cyan-800/40 bg-cyan-950/20 px-2 py-0.5 text-xs text-cyan-200">
              {documents.length}
            </span>
          </div>

          {documents.length === 0 && (
            <div className="rounded-xl border border-dashed border-cyan-800/40 bg-zinc-900/60 p-4 text-sm text-zinc-500">
              Uploaded PDFs will appear here.
            </div>
          )}

          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group relative flex items-center w-full"
            >
              <button
                onClick={() => setSelectedDocument(doc)}
                className={`flex-1 flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 pr-10 text-left text-sm transition
                
                ${
                  selectedDocument?.id === doc.id
                    ? "border-cyan-400/50 bg-cyan-950/30 text-zinc-100 accent-ring"
                    : "border-transparent text-zinc-400 hover:border-cyan-800/40 hover:bg-zinc-900/80 hover:text-zinc-200"
                }`}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-cyan-800/40 bg-zinc-950 text-cyan-200">
                  <FileText size={15} />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {doc.name}
                  </span>

                  <span className="block text-xs text-zinc-500">
                    Ready to chat
                  </span>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(doc.id);
                }}
                className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-500 opacity-0 transition duration-150 hover:border-rose-500/60 hover:bg-rose-950/40 hover:text-rose-300 focus:opacity-100 group-hover:opacity-100"
                title="Delete document"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

        </div>

      </aside>

      <UploadModal
        isOpen={isModalOpen}
        isUploading={isUploading}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleFileUpload}
        onError={onError}
      />
    </>
  );
}
