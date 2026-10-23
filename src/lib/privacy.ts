/**
 * Everything the app keeps about the person sits in this browser's storage under keys that start with "pec-"
 * (settings, progress, the arrest timer, the match plan, the scorer, the lightning countdown). Other sites on the
 * same github.io address share that storage, so only these keys are touched.
 */
export const KEY_PREFIX = "pec-";

/** The keys in a storage area that belong to this app. */
export function appKeys(storage: Pick<Storage, "length" | "key">): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k?.startsWith(KEY_PREFIX)) keys.push(k);
  }
  return keys;
}

/** Remove the person's data from this device, then reload so nothing of it stays in memory either. */
export function deleteMyData() {
  for (const area of ["localStorage", "sessionStorage"] as const) {
    try {
      const s = window[area];
      for (const k of appKeys(s)) s.removeItem(k);
    } catch {
      // storage blocked: nothing was kept there
    }
  }
  window.location.reload();
}
