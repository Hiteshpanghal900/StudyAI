import {
  Moon,
  Share2,
  Sparkles,
  Sun,
} from "lucide-react";

type Props = {
  isDarkMode: boolean;
  onToggleTheme: () => void;
};

export default function Header({
  isDarkMode,
  onToggleTheme,
}: Props) {
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-cyan-900/30 bg-zinc-950/80 px-4 backdrop-blur-xl sm:px-6 surface-glow">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-300 via-emerald-300 to-amber-300 text-zinc-950 brand-glow">
          <Sparkles size={17} />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-zinc-100">
            AI Document Workspace
          </h2>

          <p className="hidden truncate text-xs text-zinc-500 sm:block">
            Ask questions grounded in your uploaded PDFs
          </p>
        </div>
      </div>

      <div className="ml-3 flex flex-shrink-0 items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-800/40 bg-zinc-900/80 text-cyan-200 transition hover:border-cyan-400/60 hover:bg-cyan-950/40"
          aria-label={
            isDarkMode
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          title={
            isDarkMode
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          {isDarkMode ? (
            <Sun size={16} />
          ) : (
            <Moon size={16} />
          )}
        </button>

        <button className="hidden items-center gap-2 rounded-lg border border-emerald-800/40 bg-zinc-900/80 px-3 py-2 text-sm text-emerald-100 transition hover:border-emerald-400/60 hover:bg-emerald-950/40 sm:flex">
          <Share2 size={15} />
          Share
        </button>
      </div>
    </header>
  );
}
