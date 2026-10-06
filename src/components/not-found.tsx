import { Link } from "@tanstack/react-router";
import { AppShell, Panel, SectionLabel } from "@/components/workshop";

/** Shown for an address that is not a page of the app. */
export function NotFound() {
  return (
    <AppShell tab="home">
      <Panel>
        <div className="flex flex-col gap-2 px-3.5 py-3.5">
          <SectionLabel>PAGE NOT FOUND</SectionLabel>
          <p className="text-sm leading-snug">That address is not a page in this app. It may have been moved or removed.</p>
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
