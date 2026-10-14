import { Bandage, BriefcaseMedical, Gauge, HeartPulse, Megaphone, Wind } from "lucide-react";
import type { RoleId } from "@/lib/workshop";

/** One pictogram per role, so a colour is recognisable at a glance as well as by name. */
export const roleIcons: Record<RoleId, typeof HeartPulse> = {
  black: Megaphone, // leads and calls
  orange: Wind, // airway
  red: HeartPulse, // chest
  blue: Gauge, // oxygen flow
  white: Bandage, // scoop and splints
  green: BriefcaseMedical, // bag and AED
};
