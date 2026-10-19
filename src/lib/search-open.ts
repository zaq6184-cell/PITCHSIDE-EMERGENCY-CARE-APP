/** The event that opens the search panel, from a button anywhere or the keyboard. */
export const OPEN_SEARCH = "pec:search";

export function openSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH));
}
