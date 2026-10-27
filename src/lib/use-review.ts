import { useEffect, useState, useSyncExternalStore } from "react";
import { dayKey } from "@/lib/day";
import { EMPTY_REVIEW, getReview, type Review, subscribeReview } from "@/lib/review";

/** The Daily 5, kept up to date in a component (empty in the built page, filled in once it runs). */
export function useReview(): Review {
  return useSyncExternalStore(subscribeReview, getReview, () => EMPTY_REVIEW);
}

/** Today, once the page runs in the browser: the built page has no day of its own. */
export function useDay(): string | null {
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => setDay(dayKey(new Date())), []);
  return day;
}
