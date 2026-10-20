import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, CornerDownLeft, FileText, Search, Users, Wrench, X, type LucideIcon } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { prepare, search } from "@/lib/search";
import { type Entry, type Kind, QUICK, searchEntries, type Target } from "@/lib/search-index";
import { tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

const KIND: Record<Kind, { icon: LucideIcon; label: string }> = {
  page: { icon: FileText, label: "Page" },
  tool: { icon: Wrench, label: "Tool" },
  role: { icon: Users, label: "Role" },
  module: { icon: BookOpen, label: "Module" },
  section: { icon: BookOpen, label: "Section" },
};

/**
 * Search the whole guide: pages, tools, the six role cards and every module section. Opens over the
 * page; Back (the button, Escape or the phone's back gesture) closes it and leaves you where you were.
 */
export default function SearchDialog({ onClose }: { onClose: () => void }) {
  const entries = useMemo(() => searchEntries(), []);
  const prepared = useMemo(() => prepare(entries), [entries]);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();
  const id = useId();
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  const hits = useMemo(() => {
    if (!q.trim()) return QUICK.map((k) => entries.find((e) => e.id === k)).filter((e): e is Entry => Boolean(e)).map((doc) => ({ doc, snippet: doc.sub ?? "", score: 0 }));
    return search(prepared, q, 24);
  }, [q, prepared, entries]);

  // one tagged history entry, so the phone's back gesture closes search instead of leaving the page
  useEffect(() => {
    const ours = () => (window.history.state as { pecSearch?: string } | null)?.pecSearch === id;
    if (!ours()) window.history.pushState({ ...window.history.state, pecSearch: id }, "", window.location.href);
    const onPop = () => {
      if (!ours()) close.current();
    };
    window.addEventListener("popstate", onPop);
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    input.current?.focus();
    return () => {
      window.removeEventListener("popstate", onPop);
      html.style.overflow = overflow;
    };
  }, [id]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  /** Go to a result: replace search's own history entry, so Back from there returns to the page you searched from. */
  const go = (t: Target) => {
    tap();
    onClose();
    if (t.to === "/role/$id") void navigate({ to: t.to, params: { id: t.id }, replace: true });
    else if (t.to === "/station/$id") void navigate({ to: t.to, params: { id: t.id }, hash: t.hash, replace: true });
    else if (t.to === "/drill") void navigate({ to: "/drill", search: t.neck ? { case: "neck" } : {}, replace: true });
    else void navigate({ to: t.to, hash: t.hash, replace: true });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      window.history.back();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(hits.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      go(hits[active].doc.target);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search the guide"
      className="fixed inset-0 z-50 flex flex-col bg-[#05101f]/80 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) window.history.back();
      }}
      onKeyDown={onKey}
    >
      <div className="search-in mx-auto flex max-h-[min(42rem,calc(100dvh-1.5rem))] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-paper shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] ring-1 ring-gold/40">
        <div className="flex items-center gap-2 border-b border-line px-3.5">
          <Search className="size-5 shrink-0 text-gold-ink" aria-hidden />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            name="q"
            enterKeyHint="go"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search roles, modules, tools…"
            aria-label="Search the guide"
            aria-controls={`${id}-results`}
            aria-activedescendant={hits[active] ? `${id}-r${active}` : undefined}
            className="search-field min-h-14 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="Close search"
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted active:scale-95"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <p className="px-3.5 pb-1 pt-2.5 font-display text-[10.5px] font-semibold tracking-[0.16em] text-muted">
          {q.trim() ? (hits.length ? `${hits.length === 24 ? "TOP 24" : hits.length} RESULTS` : "NO MATCHES") : "QUICK LINKS"}
        </p>
        <ul ref={list} id={`${id}-results`} role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
          {hits.map((h, i) => {
            const k = KIND[h.doc.kind];
            return (
              <li key={h.doc.id} id={`${id}-r${i}`} role="option" aria-selected={i === active} data-i={i}>
                <button
                  type="button"
                  onClick={() => go(h.doc.target)}
                  onMouseMove={() => setActive(i)}
                  className={cn("flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left", i === active ? "bg-note" : "")}
                >
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-navy text-gold">
                    <k.icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-semibold tracking-wide text-heading">{h.doc.title}</span>
                    <span className="block truncate text-[11px] font-medium uppercase tracking-wider text-gold-ink">
                      {k.label} · {h.doc.sub}
                    </span>
                    {q.trim() ? <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted">{h.snippet}</span> : null}
                  </span>
                  {i === active ? <CornerDownLeft className="mt-2 hidden size-4 shrink-0 text-muted pointer-fine:block" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
          {q.trim() && !hits.length ? (
            <li className="px-3 py-6 text-center text-sm text-muted">
              Nothing found for “{q.trim()}”. Try a simpler word — or browse the{" "}
              <Link to="/stations" onClick={onClose} className="font-semibold text-gold-ink underline">
                skill modules
              </Link>
              .
            </li>
          ) : null}
        </ul>
        <p className="hidden border-t border-line px-3.5 py-2 text-[11px] text-muted pointer-fine:block">
          ↑ ↓ to move · Enter to open · Esc to close · press / or Ctrl K anywhere to search
        </p>
      </div>
    </div>,
    document.body,
  );
}
