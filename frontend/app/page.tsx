"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import PDFViewer from "@/components/PDFViewer";
import ChatArea from "@/components/ChatArea";
import {
  Group,
  Panel,
  Separator,
} from "react-resizable-panels";
import {
  AlertCircle,
  Eye,
  FileText,
  LibraryBig,
  MessageCircle,
  UploadCloud,
  X,
} from "lucide-react";
import { apiUrl } from "@/lib/api";

export type DocumentType = {
  id: string;
  name: string;
  file?: File;
  url: string;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
};

type MobileView = "library" | "preview" | "chat";

export default function HomePage() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>("library");
  const [appError, setAppError] = useState("");

  const [documents, setDocuments] = useState<
    DocumentType[]
  >([]);

  const [chatCache, setChatCache] = useState<
    Record<string, Message[]>
  >({});

  const [selectedDocument, setSelectedDocument] =
    useState<DocumentType | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch(apiUrl("/documents"));
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.detail || data?.error || "Could not load documents");
        }

        if (!Array.isArray(data)) {
          throw new Error(data?.error || "Could not load documents");
        }

        setDocuments(data);
      } catch (error) {
        console.error("Error fetching documents:", error);
        setAppError(
          error instanceof Error
            ? error.message
            : "Could not load documents"
        );
      }
    }

    fetchDocuments();
  }, []);

  const updateSelectedDocument = (document: DocumentType | null) => {
    setSelectedDocument(document);
    if (document) {
      setMobileView("preview");
    }
  };

  const renderPreviewPane = () => (
    <div className="h-full overflow-auto border-zinc-800/80 bg-zinc-900/30 md:border-r surface-glow">
      {selectedDocument ? (
        <div className="flex h-full flex-col">
          <div className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-cyan-900/30 bg-zinc-950/80 px-4 backdrop-blur sm:px-5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-300 to-emerald-300 text-zinc-950 brand-glow">
              <FileText size={15} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-200">
                {selectedDocument.name}
              </p>

              <p className="text-xs text-zinc-500">
                Indexed and ready
              </p>
            </div>
          </div>

          <PDFViewer url={selectedDocument.url} />
        </div>
      ) : (
        <div className="flex h-full items-center justify-center p-6 sm:p-8">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-emerald-300 to-amber-300 text-zinc-950 brand-glow">
              <UploadCloud size={26} />
            </div>

            <h2 className="text-lg font-semibold text-zinc-200">
              No document selected
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Upload or choose a PDF from the library to preview it here and start asking grounded questions.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderChatPane = () => (
    <ChatArea
      key={selectedDocument?.id ?? "no-document"}
      selectedDocument={selectedDocument}
      messages={
        selectedDocument
          ? chatCache[selectedDocument.id] ?? []
          : []
      }
      setMessages={(messages) => {
        if (!selectedDocument) return;

        setChatCache((prev) => ({
          ...prev,
          [selectedDocument.id]:
            typeof messages === "function"
              ? messages(prev[selectedDocument.id] ?? [])
              : messages,
        }));
      }}
    />
  );

  return (
    <main
      className={`app-shell flex h-[100dvh] overflow-hidden bg-zinc-950 text-white ${
        isDarkMode ? "" : "light-theme"
      }`}
    >

      {/* Sidebar */}
      <Sidebar
        documents={documents}
        setDocuments={setDocuments}
        selectedDocument={selectedDocument}
        setSelectedDocument={updateSelectedDocument}
        className="hidden md:flex"
        onError={setAppError}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">

        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={() =>
            setIsDarkMode((current) => !current)
          }
        />

        {appError && (
          <div className="flex flex-shrink-0 items-start gap-3 border-b border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-100 sm:px-6">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <p className="min-w-0 flex-1 leading-5">{appError}</p>
            <button
              onClick={() => setAppError("")}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-red-100/70 transition hover:bg-red-900/40 hover:text-red-50"
              aria-label="Dismiss error"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <nav className="grid flex-shrink-0 grid-cols-3 border-b border-zinc-800/80 bg-zinc-950/90 p-2 backdrop-blur md:hidden">
          {[
            { id: "library" as const, label: "Library", icon: LibraryBig },
            { id: "preview" as const, label: "Preview", icon: Eye },
            { id: "chat" as const, label: "Chat", icon: MessageCircle },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = mobileView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setMobileView(item.id)}
                className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-300 to-emerald-300 text-zinc-950 shadow-lg shadow-cyan-950/30"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="hidden flex-1 overflow-hidden bg-transparent md:flex">
          <Group orientation="horizontal" className="flex flex-1 overflow-hidden">
            <Panel defaultSize="70%" minSize="30%" maxSize="80%">
              {renderPreviewPane()}
            </Panel>

            <Separator className="h-full w-2 cursor-col-resize bg-zinc-950/60 transition hover:bg-cyan-500/30" />

            <Panel defaultSize="40%" minSize="30%" maxSize="60%">
              <div className="h-full min-w-[320px] overflow-auto">
                {renderChatPane()}
              </div>
            </Panel>
          </Group>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden bg-transparent md:hidden">
          {mobileView === "library" && (
            <Sidebar
              documents={documents}
              setDocuments={setDocuments}
              selectedDocument={selectedDocument}
              setSelectedDocument={updateSelectedDocument}
              className="h-full w-full border-r-0"
              onError={setAppError}
            />
          )}

          {mobileView === "preview" && (
            <div className="h-full w-full min-w-0">
              {renderPreviewPane()}
            </div>
          )}

          {mobileView === "chat" && (
            <div className="h-full w-full min-w-0">
              {renderChatPane()}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
