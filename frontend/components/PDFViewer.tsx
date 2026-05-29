"use client";

import {
  Document,
  Page,
  pdfjs,
} from "react-pdf";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";

import { useEffect, useRef, useState } from "react";

const PDF_OPTIONS = { cMapUrl: "cmaps/", cMapPacked: true } as const;

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function PDFViewer({
  url,
}: {
  url: string;
}) {
  const [numPages, setNumPages] = useState(0);
  const [pageWidth, setPageWidth] = useState(700);
  const [errorMessage, setErrorMessage] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const width = entries[0]?.contentRect.width ?? 700;
        setPageWidth(Math.max(220, width - 32));
      }, 100); // 100ms debounce
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full overflow-auto p-3 sm:p-6">
      {errorMessage && (
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="max-w-sm rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-center">
            <p className="text-sm font-medium text-red-200">
              PDF preview unavailable
            </p>
            <p className="mt-2 text-sm leading-6 text-red-200/70">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {!errorMessage && (
      <Document
        file={url}
        options={PDF_OPTIONS}
        onLoadSuccess={({ numPages }) =>
          {
            setErrorMessage("");
            setNumPages(numPages);
          }
        }
        loading={
          <div className="flex h-[600px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-900/40 border-t-cyan-300" />
              <p className="text-sm text-zinc-500">
                Loading PDF preview...
              </p>
            </div>
          </div>
        }
        onLoadError={(error) => {
          console.error("PDF load error:", error);
          setErrorMessage("The file could not be rendered in the browser.");
        }}
        onSourceError={(error) => {
          console.error("PDF source error:", error);
          setErrorMessage("The PDF source could not be loaded.");
        }}
      >
        {Array.from(
          new Array(numPages),
          (_, index) => (
            <Page
              key={index}
              pageNumber={index + 1}
              width={pageWidth}
              renderTextLayer={false}
              className="mb-6 overflow-hidden rounded-xl"
            />
          )
        )}
      </Document>
      )}
    </div>
  );
}
