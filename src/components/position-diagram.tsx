import type { RoleId } from "@/lib/workshop";

/**
 * Where each PEAP role sits around the player, seen from above with the head at the top.
 * Drawn for this guide from the positions on FIFA's PEAP poster: Orange and Green at the head,
 * Red / Blue / White down the player's right, Black on the player's left.
 */
const MARKS: { id: RoleId; label: string; x: number; y: number; fill: string; ink: string }[] = [
  { id: "orange", label: "Orange", x: 112, y: 46, fill: "#E36B12", ink: "#FFFFFF" },
  { id: "green", label: "Green", x: 212, y: 34, fill: "#1E8A4C", ink: "#FFFFFF" },
  { id: "red", label: "Red", x: 62, y: 150, fill: "#C0392B", ink: "#FFFFFF" },
  { id: "blue", label: "Blue", x: 50, y: 226, fill: "#1F6AA5", ink: "#FFFFFF" },
  { id: "white", label: "White", x: 62, y: 304, fill: "#FFFFFF", ink: "#1C1C1C" },
  { id: "black", label: "Black", x: 262, y: 168, fill: "#1C1C1C", ink: "#FFFFFF" },
];

export function PositionDiagram({ highlight, caption }: { highlight?: RoleId; caption?: string }) {
  const title = highlight
    ? `Position of ${MARKS.find((m) => m.id === highlight)?.label} around the player`
    : "Positions of the six PEAP roles around the player";
  return (
    <figure className="bg-cream px-3 py-3">
      <svg viewBox="0 0 320 380" role="img" aria-label={title} className="mx-auto block h-auto w-full max-w-[19rem]">
        {/* side labels */}
        <text x="14" y="366" fontSize="10" fontWeight="700" fill="#5B6470" letterSpacing="1">
          PLAYER'S RIGHT
        </text>
        <text x="306" y="366" fontSize="10" fontWeight="700" fill="#5B6470" letterSpacing="1" textAnchor="end">
          PLAYER'S LEFT
        </text>
        <text x="160" y="12" fontSize="10" fontWeight="700" fill="#5B6470" letterSpacing="1" textAnchor="middle">
          HEAD
        </text>

        {/* player, lying on the back, head at the top */}
        <g fill="#0B1F3A">
          <circle cx="160" cy="62" r="19" />
          <rect x="132" y="86" width="56" height="104" rx="16" />
          <rect x="108" y="92" width="20" height="92" rx="10" />
          <rect x="192" y="92" width="20" height="92" rx="10" />
          <rect x="134" y="180" width="24" height="150" rx="11" />
          <rect x="162" y="180" width="24" height="150" rx="11" />
        </g>

        {/* FIFA bag and AED beside Green */}
        <g opacity={highlight && highlight !== "green" ? 0.35 : 1}>
          <rect x="238" y="50" width="34" height="26" rx="4" fill="#F2C811" stroke="#0B1F3A" strokeWidth="1.5" />
          <rect x="276" y="56" width="22" height="20" rx="4" fill="#7FB8C9" stroke="#0B1F3A" strokeWidth="1.5" />
          <text x="255" y="90" fontSize="8.5" fontWeight="700" fill="#5B6470" textAnchor="middle">
            BAG
          </text>
          <text x="287" y="90" fontSize="8.5" fontWeight="700" fill="#5B6470" textAnchor="middle">
            AED
          </text>
        </g>

        {MARKS.map((m) => {
          const on = !highlight || highlight === m.id;
          return (
            <g key={m.id} opacity={on ? 1 : 0.3}>
              {highlight === m.id ? <circle cx={m.x} cy={m.y} r="31" fill="none" stroke="#C9A227" strokeWidth="3" /> : null}
              <circle cx={m.x} cy={m.y} r="25" fill={m.fill} stroke="#0B1F3A" strokeWidth={m.id === "white" ? 1.5 : 0} />
              <text x={m.x} y={m.y + 4} fontSize="11" fontWeight="700" fill={m.ink} textAnchor="middle">
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-center text-xs leading-snug text-muted">
        {caption ?? "Seen from above. Positions may all be flipped depending on the site of injury and hazards."}
      </figcaption>
    </figure>
  );
}
