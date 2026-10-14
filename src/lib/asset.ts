import { IMAGE_SIZES } from "@/lib/image-sizes";

/** Prefix public files with Vite `base` so GitHub Pages (`/repo/…`) and `/` both work. */
export function asset(path: string) {
  const base = import.meta.env.BASE_URL || "/"
  const clean = path.replace(/^\//, "")
  return `${base}${clean}`
}

/** width and height of a picture in public/img, so the page keeps its space before the file arrives. */
export function imageSize(src: string): { width?: number; height?: number } {
  const base = import.meta.env.BASE_URL || "/"
  const size = IMAGE_SIZES[`/${src.startsWith(base) ? src.slice(base.length) : src.replace(/^\//, "")}`]
  return size ? { width: size[0], height: size[1] } : {}
}
