import { asset } from "@/lib/asset";
import { translateText } from "@/lib/i18n";

/** This guide's public address: the page the app opens on. */
export function siteUrl() {
  return new URL(asset("/"), window.location.href).href;
}

/**
 * Opens the device's share sheet (WhatsApp, Messages, email …); where there is none, copies the text
 * instead. Nothing is sent anywhere unless the person picks where it goes.
 */
export async function shareOrCopy(raw: { title: string; text: string; url?: string }): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  // in the reader's language, like the page it came from
  const data = { ...raw, title: translateText(raw.title), text: translateText(raw.text) };
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
      // share sheet not allowed here: copy instead
    }
  }
  const text = data.url ? `${data.text}\n${data.url}` : data.text;
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return copyTheOldWay(text) ? "copied" : "failed";
  }
}

/** For browsers that block the clipboard API (in-app browsers, some webviews). */
function copyTheOldWay(text: string) {
  const box = document.createElement("textarea");
  box.value = text;
  box.setAttribute("readonly", "");
  box.style.position = "fixed";
  box.style.opacity = "0";
  document.body.appendChild(box);
  box.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  box.remove();
  return ok;
}
