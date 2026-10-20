import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Panel, SectionLabel } from "@/components/workshop";

/**
 * Shown for an address that is not a page of the app. On the published site such an address gets the
 * empty app shell (404.html), so this waits until the page is running before drawing — the first render
 * then matches the shell and React does not report a hydration mismatch. Where a server did render it
 * (the dev server), it is drawn straight away.
 */
export function NotFound() {
  const [ready, setReady] = useState(() => typeof document === "undefined" || Boolean(document.getElementById("pec-not-found")));
  useEffect(() => {
    setReady(true);
    document.title = "Page not found · Pitchside Emergency Care";
  }, []);
  if (!ready) return null;
  return (
    <AppShell tab="home" heading="Page not found">
      <Panel>
        <div id="pec-not-found" className="flex flex-col gap-2 px-3.5 py-3.5">
          <SectionLabel>PAGE NOT FOUND</SectionLabel>
          <p className="text-sm leading-snug">That address is not a page in this guide. It may have been moved or removed.</p>
          <Link
            to="/"
            className="mt-1 inline-flex min-h-11 items-center justify-center self-start rounded-lg bg-navy px-4 font-display text-sm font-semibold tracking-wide text-on-navy transition-transform duration-150 ease-out active:scale-95"
          >
            Go to Home
          </Link>
        </div>
      </Panel>
    </AppShell>
  );
}
