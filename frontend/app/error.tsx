"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-zinc-950 p-6 text-white">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center shadow-2xl shadow-black/40">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-red-900/60 bg-red-950/30 text-red-200">
          <AlertTriangle size={22} />
        </div>

        <h1 className="text-lg font-semibold text-zinc-100">
          Something went wrong
        </h1>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          The workspace hit an unexpected error. Try reloading this view.
        </p>

        <button
          onClick={reset}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          <RotateCcw size={15} />
          Reload
        </button>
      </div>
    </main>
  );
}
