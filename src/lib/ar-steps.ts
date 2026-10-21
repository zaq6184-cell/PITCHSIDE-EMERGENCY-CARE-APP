import type { ArClip, ArDrill } from "@/lib/ar";
import { spineSteps } from "@/lib/spine-drill";
import { workshop } from "@/lib/workshop";

export const AR_DRILL_NAME: Record<ArDrill, string> = { arrest: "Cardiac arrest", spine: "Neck injury" };

/** "The team in place", "The whole drill", or the step's own title from the drill. */
export function arStepTitle(drill: ArDrill, step: ArClip) {
  if (step === "all") return "The whole drill";
  if (step <= 0) return "The team in place";
  const steps = drill === "spine" ? spineSteps : workshop.steps;
  return steps[step - 1]?.title ?? "The team in place";
}

/** The title Google's AR viewer shows at the top: "Cardiac arrest · Step 4: Airway and oxygen". */
export const arTitle = (drill: ArDrill, step: ArClip) =>
  `${AR_DRILL_NAME[drill]} · ${step !== "all" && step > 0 ? `Step ${step}: ${arStepTitle(drill, step)}` : arStepTitle(drill, step)}`;
