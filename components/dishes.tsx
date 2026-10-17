// Illustrated dishes, served top-down in stainless-steel katoris and thalis.
// Each restaurant's own photos replace these in production; the illustrations
// keep the prototype appetising without depending on stock photography.

import { useId } from "react";

export type DishKind = "biryani" | "paneer-tikka" | "dal-makhani" | "thali" | "chole-bhature" | "gulab-jamun" | "rajma-chawal" | "butter-naan";

export const DISH_KINDS: DishKind[] = ["biryani", "paneer-tikka", "dal-makhani", "thali", "chole-bhature", "gulab-jamun", "rajma-chawal", "butter-naan"];

/** Steel katori: rim, inner wall, then the food surface. */
function Katori({ cx, cy, r, fill, id, children }: { cx: number; cy: number; r: number; fill: string; id: string; children?: React.ReactNode }) {
  return (
    <g>
      <circle cx={cx} cy={cy + r * 0.06} r={r} fill="rgba(20,30,25,0.18)" />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-steel)`} />
      <circle cx={cx} cy={cy} r={r * 0.84} fill="#9aa39e" />
      <circle cx={cx} cy={cy} r={r * 0.8} fill={fill} />
      {children}
      <ellipse cx={cx - r * 0.35} cy={cy - r * 0.62} rx={r * 0.32} ry={r * 0.08} fill="rgba(255,255,255,0.55)" transform={`rotate(-28 ${cx - r * 0.35} ${cy - r * 0.62})`} />
    </g>
  );
}

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-steel`} cx="35%" cy="30%" r="80%">
        <stop offset="0" stopColor="#f7f9f8" />
        <stop offset="0.55" stopColor="#c9d0cc" />
        <stop offset="1" stopColor="#8e9893" />
      </radialGradient>
      <radialGradient id={`${id}-plate`} cx="40%" cy="35%" r="75%">
        <stop offset="0" stopColor="#f4f6f5" />
        <stop offset="0.7" stopColor="#d4dad6" />
        <stop offset="1" stopColor="#a9b2ad" />
      </radialGradient>
      <radialGradient id={`${id}-gloss`} cx="35%" cy="30%" r="70%">
        <stop offset="0" stopColor="rgba(255,255,255,0.6)" />
        <stop offset="0.4" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
      <radialGradient id={`${id}-bhatura`} cx="40%" cy="35%" r="70%">
        <stop offset="0" stopColor="#f6d79a" />
        <stop offset="0.7" stopColor="#e2a85a" />
        <stop offset="1" stopColor="#b97a35" />
      </radialGradient>
    </defs>
  );
}

// Deterministic scatter so grains and garnish don't shift between renders.
function scatter(n: number, seed: number, cx: number, cy: number, r: number) {
  const pts: { x: number; y: number; a: number }[] = [];
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) {
    const ang = rnd() * Math.PI * 2;
    const rad = Math.sqrt(rnd()) * r;
    pts.push({ x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad, a: rnd() * 180 });
  }
  return pts;
}

function Rice({ cx, cy, r, seed, saffron = false }: { cx: number; cy: number; r: number; seed: number; saffron?: boolean }) {
  const colors = saffron ? ["#fff6e0", "#f6c453", "#f08a24", "#fff1cc"] : ["#fffdf6", "#f4efe2"];
  return (
    <g>
      {scatter(70, seed, cx, cy, r).map((p, i) => (
        <rect key={i} x={p.x - 2.6} y={p.y - 0.9} width={5.2} height={1.8} rx={0.9} fill={colors[i % colors.length]} transform={`rotate(${p.a} ${p.x} ${p.y})`} />
      ))}
    </g>
  );
}

function Coriander({ cx, cy, r, seed, n = 8 }: { cx: number; cy: number; r: number; seed: number; n?: number }) {
  return (
    <g>
      {scatter(n, seed, cx, cy, r).map((p, i) => (
        <path key={i} d={`M${p.x} ${p.y} q2 -3 4 0 q-2 3 -4 0z`} fill={i % 3 ? "#3f8a3a" : "#5aa34a"} transform={`rotate(${p.a} ${p.x} ${p.y})`} />
      ))}
    </g>
  );
}

function Roti({ cx, cy, r, seed, tone = "#e9c48a" }: { cx: number; cy: number; r: number; seed: number; tone?: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={tone} stroke="#c99a5a" strokeWidth={0.8} />
      {scatter(9, seed, cx, cy, r * 0.8).map((p, i) => (
        <ellipse key={i} cx={p.x} cy={p.y} rx={1.8 + (i % 3)} ry={1.2 + (i % 2)} fill="#8a5a2b" opacity={0.55} />
      ))}
    </g>
  );
}

function DishArt({ kind, id }: { kind: DishKind; id: string }) {
  switch (kind) {
    case "biryani":
      return (
        <Katori cx={60} cy={60} r={52} fill="#f3d98f" id={id}>
          <Rice cx={60} cy={60} r={38} seed={7} saffron />
          {[[48, 50], [70, 58], [56, 72]].map(([x, y], i) => (
            <path key={i} d={`M${x - 8} ${y} q2 -9 10 -8 q9 2 7 10 q-3 7 -10 6 q-8 -1 -7 -8z`} fill="#9a4e22" stroke="#6e3313" strokeWidth={0.8} />
          ))}
          {scatter(10, 3, 60, 60, 34).map((p, i) => (
            <path key={i} d={`M${p.x} ${p.y} q3 -1 6 1`} stroke="#7a3d14" strokeWidth={1.6} fill="none" strokeLinecap="round" />
          ))}
          <path d="M64 44 q4 -6 9 -3 q-3 5 -9 3z M66 46 q-5 -4 -2 -9" fill="#2f7d3a" />
          <path d="M42 66 q5 -5 9 -1 q-4 5 -9 1z" fill="#2f7d3a" />
        </Katori>
      );
    case "dal-makhani":
      return (
        <Katori cx={60} cy={60} r={52} fill="#6a2c14" id={id}>
          <circle cx={60} cy={60} r={41} fill="#7b3519" />
          {scatter(26, 11, 60, 60, 36).map((p, i) => (
            <ellipse key={i} cx={p.x} cy={p.y} rx={2.2} ry={1.5} fill="#4a1c0b" opacity={0.7} transform={`rotate(${p.a} ${p.x} ${p.y})`} />
          ))}
          <path d="M44 52 c8 -8 22 -6 26 2 c4 8 -6 14 -14 10 c-6 -3 -2 -10 4 -8" stroke="#fbf3e4" strokeWidth={3.2} fill="none" strokeLinecap="round" />
          <circle cx={70} cy={70} r={4} fill="#f6d47a" />
          <Coriander cx={60} cy={60} r={30} seed={5} n={7} />
        </Katori>
      );
    case "paneer-tikka":
      return (
        <g>
          <circle cx={60} cy={63} r={54} fill="rgba(20,30,25,0.16)" />
          <circle cx={60} cy={60} r={54} fill={`url(#${id}-plate)`} />
          <circle cx={60} cy={60} r={44} fill="#e7ebe8" />
          {[[38, 48], [56, 42], [74, 50], [46, 66], [66, 68]].map(([x, y], i) => (
            <g key={i} transform={`rotate(${(i * 23) % 40 - 20} ${x} ${y})`}>
              <rect x={x - 8} y={y - 8} width={16} height={16} rx={3} fill="#f6e3b8" />
              <rect x={x - 8} y={y - 8} width={16} height={16} rx={3} fill="#e0732a" opacity={0.85} />
              <path d={`M${x - 6} ${y - 3} l12 0 M${x - 6} ${y + 3} l12 0`} stroke="#5a2a10" strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
            </g>
          ))}
          <path d="M30 80 q8 -6 14 0" stroke="#c24a5a" strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d="M80 34 q6 4 4 10" stroke="#3f8a3a" strokeWidth={3.5} fill="none" strokeLinecap="round" />
          <path d="M84 72 l10 -2 l-4 9z" fill="#f2df5a" stroke="#c9b23a" strokeWidth={0.8} />
          <circle cx={88} cy={86} r={9} fill={`url(#${id}-steel)`} />
          <circle cx={88} cy={86} r={6.5} fill="#3f8a3a" />
        </g>
      );
    case "thali":
      return (
        <g>
          <circle cx={60} cy={63} r={56} fill="rgba(20,30,25,0.18)" />
          <circle cx={60} cy={60} r={56} fill={`url(#${id}-plate)`} />
          <circle cx={60} cy={60} r={50} fill="#dde2df" />
          <Katori cx={34} cy={36} r={14} fill="#e8b33a" id={id}>
            <Coriander cx={34} cy={36} r={8} seed={2} n={3} />
          </Katori>
          <Katori cx={60} cy={26} r={13} fill="#5d8c32" id={id} />
          <Katori cx={86} cy={36} r={14} fill="#d9622b" id={id}>
            <rect x={82} y={32} width={6} height={6} rx={1} fill="#fbecc8" />
          </Katori>
          <Katori cx={88} cy={66} r={12} fill="#f8f4ea" id={id}>
            <Coriander cx={88} cy={66} r={6} seed={9} n={3} />
          </Katori>
          <ellipse cx={54} cy={62} rx={18} ry={14} fill="#fffdf6" />
          <Rice cx={54} cy={62} r={14} seed={4} />
          <Roti cx={42} cy={86} r={15} seed={6} />
          <Roti cx={58} cy={92} r={13} seed={8} tone="#efcf98" />
          <path d="M78 84 l12 6 l-4 8 l-12 -4z" fill="#7a2e1a" opacity={0.85} />
        </g>
      );
    case "chole-bhature":
      return (
        <g>
          <circle cx={60} cy={63} r={54} fill="rgba(20,30,25,0.16)" />
          <circle cx={60} cy={60} r={54} fill={`url(#${id}-plate)`} />
          <ellipse cx={46} cy={54} rx={30} ry={26} fill={`url(#${id}-bhatura)`} />
          <ellipse cx={46} cy={54} rx={30} ry={26} fill={`url(#${id}-gloss)`} />
          <path d="M28 60 q10 8 26 4" stroke="#b97a35" strokeWidth={1.2} fill="none" opacity={0.6} />
          <Katori cx={80} cy={76} r={20} fill="#8a3e1a" id={id}>
            {scatter(12, 13, 80, 76, 11).map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={2.4} fill="#d9a35c" stroke="#7a3a16" strokeWidth={0.5} />
            ))}
            <Coriander cx={80} cy={76} r={10} seed={1} n={4} />
          </Katori>
          <circle cx={34} cy={88} r={6} fill="none" stroke="#d98aa8" strokeWidth={2.4} />
          <circle cx={44} cy={92} r={5} fill="none" stroke="#d98aa8" strokeWidth={2.2} />
        </g>
      );
    case "gulab-jamun":
      return (
        <Katori cx={60} cy={60} r={52} fill="#c9752a" id={id}>
          <circle cx={60} cy={60} r={41} fill="#d98a35" opacity={0.85} />
          {[[48, 54], [72, 64]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={15} fill="#5a2210" />
              <circle cx={x} cy={y} r={15} fill={`url(#${id}-gloss)`} />
            </g>
          ))}
          {scatter(7, 17, 60, 58, 22).map((p, i) => (
            <rect key={i} x={p.x} y={p.y} width={5} height={1.8} rx={0.9} fill="#8cbf4a" transform={`rotate(${p.a} ${p.x} ${p.y})`} />
          ))}
        </Katori>
      );
    case "rajma-chawal":
      return (
        <g>
          <circle cx={60} cy={63} r={54} fill="rgba(20,30,25,0.16)" />
          <circle cx={60} cy={60} r={54} fill={`url(#${id}-plate)`} />
          <path d="M14 60 a46 46 0 0 1 92 0z" fill="#fffdf6" />
          <Rice cx={60} cy={44} r={30} seed={19} />
          <path d="M14 60 a46 46 0 0 0 92 0z" fill="#8a2a1a" />
          {scatter(16, 23, 60, 78, 22).map((p, i) => (
            <ellipse key={i} cx={p.x} cy={p.y} rx={3.4} ry={2.2} fill="#5a1410" stroke="#3a0a08" strokeWidth={0.5} transform={`rotate(${p.a} ${p.x} ${p.y})`} />
          ))}
          <Coriander cx={60} cy={76} r={20} seed={21} n={6} />
        </g>
      );
    case "butter-naan":
      return (
        <g>
          <circle cx={60} cy={63} r={54} fill="rgba(20,30,25,0.16)" />
          <circle cx={60} cy={60} r={54} fill={`url(#${id}-plate)`} />
          <path d="M26 40 q30 -18 66 0 q10 24 -6 44 q-30 14 -56 -2 q-14 -20 -4 -42z" fill="#eccb8c" stroke="#c9974e" strokeWidth={1} />
          {scatter(14, 31, 58, 58, 28).map((p, i) => (
            <ellipse key={i} cx={p.x} cy={p.y} rx={3 + (i % 3)} ry={2} fill="#7a4a1e" opacity={0.6} transform={`rotate(${p.a} ${p.x} ${p.y})`} />
          ))}
          <ellipse cx={62} cy={56} rx={10} ry={6} fill="#ffe27a" opacity={0.8} />
          <Coriander cx={58} cy={58} r={24} seed={33} n={6} />
        </g>
      );
  }
}

/**
 * A plated dish. `steam` adds wisps that rise and fade; they stop under
 * reduced-motion settings.
 */
export function Dish({ kind, size = 120, steam = false, className = "", label }: { kind: DishKind; size?: number; steam?: boolean; className?: string; label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={`overflow-visible ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <Defs id={id} />
      <DishArt kind={kind} id={id} />
      {steam && (
        <g className="steam" stroke="rgba(255,255,255,0.85)" strokeWidth={3} fill="none" strokeLinecap="round">
          <path d="M48 40 c-6 -8 6 -12 0 -22" />
          <path d="M60 36 c-6 -8 6 -12 0 -24" />
          <path d="M72 40 c-6 -8 6 -12 0 -22" />
        </g>
      )}
    </svg>
  );
}

/** Whole spices, for garnish around the landing page. */
export function Spice({ kind, size = 40, className = "" }: { kind: "chilli" | "star-anise" | "cardamom" | "cinnamon" | "leaf"; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden className={className}>
      {kind === "chilli" && (
        <g>
          <path d="M8 30 C14 30 28 22 32 10 C33 7 30 6 29 9 C25 18 16 24 8 26 C5 27 5 30 8 30z" fill="#c8371f" />
          <path d="M29 9 C30 6 32 4 34 4" stroke="#3f7a2e" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <path d="M12 27 C18 25 24 20 27 14" stroke="rgba(255,255,255,0.45)" strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </g>
      )}
      {kind === "star-anise" && (
        <g transform="translate(20 20)">
          {Array.from({ length: 8 }).map((_, i) => (
            <g key={i} transform={`rotate(${i * 45})`}>
              <path d="M0 -2 C3 -6 3 -14 0 -17 C-3 -14 -3 -6 0 -2z" fill="#6b3a1e" />
              <ellipse cx={0} cy={-10} rx={1.3} ry={2.2} fill="#c98a4a" />
            </g>
          ))}
          <circle r={2.6} fill="#4a2410" />
        </g>
      )}
      {kind === "cardamom" && (
        <g>
          <path d="M20 4 C30 10 30 30 20 36 C10 30 10 10 20 4z" fill="#8fae5a" />
          <path d="M20 6 L20 34 M15 12 C17 20 17 26 15 30 M25 12 C23 20 23 26 25 30" stroke="#6a8a3e" strokeWidth={1.2} fill="none" />
        </g>
      )}
      {kind === "cinnamon" && (
        <g transform="rotate(-30 20 20)">
          <rect x={4} y={14} width={32} height={12} rx={6} fill="#9a5a2a" />
          <path d="M6 18 H34 M6 22 H34" stroke="#6b3a1e" strokeWidth={1.2} />
          <ellipse cx={36} cy={20} rx={3} ry={6} fill="#c58a4e" />
          <path d="M36 16 a3 4 0 1 0 0.1 0" stroke="#6b3a1e" strokeWidth={1} fill="none" />
        </g>
      )}
      {kind === "leaf" && (
        <g>
          <path d="M6 34 C6 18 18 6 34 6 C34 22 22 34 6 34z" fill="#3f8a3a" />
          <path d="M8 32 L30 10" stroke="#2a6a28" strokeWidth={1.4} />
        </g>
      )}
    </svg>
  );
}
