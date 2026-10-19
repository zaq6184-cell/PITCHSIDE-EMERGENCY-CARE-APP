import { Search } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { OPEN_SEARCH, openSearch } from "@/lib/search-open";
import { tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

const SearchDialog = lazy(() => import("@/components/search-dialog"));

/** Keeps search ready on every page: "/" or Ctrl/⌘ K opens it; the panel loads the first time it is used. */
export function SearchHost() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener(OPEN_SEARCH, show);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_SEARCH, show);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  if (!open) return null;
  return (
    <Suspense fallback={null}>
      <SearchDialog onClose={() => setOpen(false)} />
    </Suspense>
  );
}

/** A search bar that opens the search panel (it looks like a field, so it reads as "type here"). */
export function SearchBar({ className, label = "Search roles, modules, tools…" }: { className?: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        tap();
        openSearch();
      }}
      className={cn(
        "flex min-h-12 w-full items-center gap-2.5 rounded-xl bg-paper px-3.5 text-left text-sm text-muted shadow-card ring-1 ring-line transition-transform duration-150 active:scale-[0.99]",
        className,
      )}
    >
      <Search className="size-[1.1rem] shrink-0 text-gold-ink" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-sans text-[11px] text-muted pointer-fine:inline">/</kbd>
    </button>
  );
}
