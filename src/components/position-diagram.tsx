import { Link } from "@tanstack/react-router";
import { setTransitionDirection } from "@/lib/gestures";
import { haptic, say, sfx } from "@/lib/sound";
import { getRole, type RoleId, workshop } from "@/lib/workshop";

/**
 * Where each PEAP role sits around the player, seen from above with the head at the top.
 * Drawn for this guide from the positions on FIFA's PEAP poster: Orange and Green at the head,
 * Red / Blue / White down the player's right, Black on the player's left.
 */
export const MARKS: { id: RoleId; label: string; x: number; y: number; fill: string; ink: string; where: string }[] = [
  { id: "orange", label: "Orange", x: 112, y: 46, fill: "#E36B12", ink: "#0B1F3A", where: "at the head" },
  { id: "green", label: "Green", x: 212, y: 34, fill: "#1A7F45", ink: "#FFFFFF", where: "at the head on the player's left, by the bag and AED" },
  { id: "red", label: "Red", x: 62, y: 150, fill: "#C0392B", ink: "#FFFFFF", where: "player's right, level with the chest" },
  { id: "blue", label: "Blue", x: 50, y: 226, fill: "#1F6AA5", ink: "#FFFFFF", where: "player's right, level with the pelvis" },
  { id: "white", label: "White", x: 62, y: 304, fill: "#FFFFFF", ink: "#1C1C1C", where: "player's right, level with the lower legs" },
  { id: "black", label: "Black", x: 262, y: 168, fill: "#1C1C1C", ink: "#FFFFFF", where: "player's left, level with the chest" },
];

/** Side labels, the player and the bag/AED: shared by the diagram and the "place the team" game. */
export function DiagramBase({ dimBag }: { dimBag?: boolean }) {
  return (
    <>
      <text x="14" y="366" fontSize="10" fontWeight="700" className="fill-muted" letterSpacing="1">
        PLAYER'S RIGHT
      </text>
      <text x="306" y="366" fontSize="10" fontWeight="700" className="fill-muted" letterSpacing="1" textAnchor="end">
        PLAYER'S LEFT
      </text>
      <text x="160" y="12" fontSize="10" fontWeight="700" className="fill-muted" letterSpacing="1" textAnchor="middle">
        HEAD
      </text>

      {/* player, lying on the back, head at the top */}
      <g className="fill-heading">
        <circle cx="160" cy="62" r="19" />
        <rect x="132" y="86" width="56" height="104" rx="16" />
        <rect x="108" y="92" width="20" height="92" rx="10" />
        <rect x="192" y="92" width="20" height="92" rx="10" />
        <rect x="134" y="180" width="24" height="150" rx="11" />
        <rect x="162" y="180" width="24" height="150" rx="11" />
      </g>

      {/* FIFA bag and AED beside Green */}
      <g opacity={dimBag ? 0.35 : 1}>
        <rect x="238" y="50" width="34" height="26" rx="4" fill="#2b4c80" className="stroke-heading" strokeWidth="1.5" />
        <rect x="276" y="56" width="22" height="20" rx="4" fill="#F2C811" className="stroke-heading" strokeWidth="1.5" />
        <text x="255" y="90" fontSize="8.5" fontWeight="700" className="fill-muted" textAnchor="middle">
          BAG
        </text>
        <text x="287" y="90" fontSize="8.5" fontWeight="700" className="fill-muted" textAnchor="middle">
          AED
        </text>
      </g>
    </>
  );
}

/** One colour disc with its name. */
export function RoleDisc({ id, x, y, r = 25 }: { id: RoleId; x: number; y: number; r?: number }) {
  const m = MARKS.find((k) => k.id === id);
  if (!m) return null;
  return (
    <>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={m.fill}
        // white needs an edge on a light page, black needs one on a dark page
        className={m.id === "white" ? "stroke-navy" : m.id === "black" ? "stroke-transparent dark:stroke-white/40" : undefined}
        strokeWidth={m.id === "white" || m.id === "black" ? 1.5 : 0}
      />
      <text x={x} y={y + 4} fontSize="11" fontWeight="700" fill={m.ink} textAnchor="middle">
        {m.label}
      </text>
    </>
  );
}

/** Each colour speaks its first "What you say" line when its disc is tapped. */
const hear = (id: RoleId) => void say(`${id}-1`);

/**
 * `linkRoles`: each disc opens that colour's role page (with a whoosh and that colour's call-out);
 * the highlighted disc replays its own call-out instead.
 */
export function PositionDiagram({ highlight, caption, linkRoles }: { highlight?: RoleId; caption?: string; linkRoles?: boolean }) {
  const title = highlight
    ? `Position of ${MARKS.find((m) => m.id === highlight)?.label} around the player`
    : "Positions of the six PEAP roles around the player";
  const order = workshop.roles.map((r) => r.id);
  return (
    <figure className="bg-cream px-3 py-3">
      <svg
        viewBox="0 0 320 380"
        role={linkRoles ? "group" : "img"}
        aria-label={linkRoles ? `${title}. Tap a colour to open its role.` : title}
        className="mx-auto block h-auto w-full max-w-[19rem]"
      >
        <DiagramBase dimBag={Boolean(highlight && highlight !== "green")} />
        {MARKS.map((m) => {
          const on = !highlight || highlight === m.id;
          const disc = (
            <g opacity={on ? 1 : 0.3}>
              {highlight === m.id ? <circle cx={m.x} cy={m.y} r="31" fill="none" stroke="#C9A227" strokeWidth="3" /> : null}
              {linkRoles ? <circle className="disc-focus" cx={m.x} cy={m.y} r="34" fill="none" strokeWidth="3" /> : null}
              <RoleDisc id={m.id} x={m.x} y={m.y} />
            </g>
          );
          if (!linkRoles) return <g key={m.id}>{disc}</g>;
          const role = getRole(m.id)?.role ?? "";
          if (m.id === highlight) {
            return (
              <g
                key={m.id}
                role="button"
                tabIndex={0}
                aria-label={`${m.label}, ${role}: hear the call-out`}
                className="disc-link"
                onClick={() => {
                  haptic(10);
                  hear(m.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    hear(m.id);
                  }
                }}
              >
                {disc}
              </g>
            );
          }
          return (
            <Link
              key={m.id}
              to="/role/$id"
              params={{ id: m.id }}
              aria-label={`${m.label}, ${role}: open this role`}
              className="disc-link"
              onClick={() => {
                haptic(10);
                setTransitionDirection(highlight && order.indexOf(m.id) < order.indexOf(highlight) ? "back" : "forward");
                sfx("whoosh", 0.25);
                hear(m.id);
              }}
            >
              {disc}
            </Link>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-center text-xs leading-snug text-muted">
        {caption ??
          (linkRoles
            ? "Seen from above. Tap a colour to open its role. Positions may all be flipped depending on the site of injury and hazards."
            : "Seen from above. Positions may all be flipped depending on the site of injury and hazards.")}
      </figcaption>
    </figure>
  );
}
