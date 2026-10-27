import { Link } from "@tanstack/react-router";
import { ChevronRight, Flame } from "lucide-react";
import { Panel } from "@/components/workshop";
import { DAILY, doneToday, streakNow } from "@/lib/review";
import { useDay, useReview } from "@/lib/use-review";
import { cn } from "@/lib/utils";

/** Home: today's five questions, how many are done, and the streak. */
export function DailyCard() {
  const r = useReview();
  const day = useDay();
  const today = day && r.today?.day === day ? r.today : null;
  const answered = today ? Object.keys(today.answers).length : 0;
  const done = day ? doneToday(r, day) : false;
  const streak = day ? streakNow(r, day) : 0;
  return (
    <Link to="/daily" className="block active:scale-[0.99]">
      <Panel>
        <div className="flex items-center gap-3 px-3.5 py-3">
          <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl text-white", streak ? "bg-gradient-to-br from-[#f59e0b] to-[#c2410c]" : "bg-navy text-gold")}>
            <Flame className="size-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[11px] font-semibold tracking-[0.16em] text-gold-ink">DAILY 5</span>
            <span className="block font-display text-base font-bold leading-tight text-heading">
              {done ? "Done for today" : answered ? `${answered} of ${DAILY} done today` : "Today's five questions"}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-muted">
              {streak === 1 ? "1 day in a row" : streak ? `${streak} days in a row` : "Two minutes a day keeps every colour's job fresh"}
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-gold-ink" aria-hidden />
        </div>
      </Panel>
    </Link>
  );
}
