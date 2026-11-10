/**
 * A badge on Home (components/progress-ui.tsx) can take you to a section of another page. It marks that section here,
 * and the page shell (components/workshop.tsx) lights it up once the page is there, so you see where to start. Only a
 * marked section lights up: the jump chips and other links to a section stay as they were.
 */
let pending: string | null = null;

/** Mark the section (its id) that a link is about to open. */
export function arriveAt(id: string) {
  pending = id;
}

/** True once for the section that was marked, when the page reaches it. */
export function takeArrival(id: string) {
  if (pending !== id) return false;
  pending = null;
  return true;
}
