import { createRouter } from "@tanstack/react-router";
import { NotFound } from "@/components/not-found";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

const basepath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || undefined;

export function getRouter() {
  return createRouter({
    routeTree,
    basepath,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
    // smooth cross-fades between pages (where the browser supports view transitions)
    defaultViewTransition: true,
    // start loading a page's code as soon as a finger or pointer reaches for its link
    defaultPreload: "intent",
  });
}
