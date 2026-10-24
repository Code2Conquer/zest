"use client";

import { useEffect, useState } from "react";

// Zest saying something beside its orb: a speech bubble whose tail points at the orb. It "types" for a
// beat, then the words arrive one by one, and after a while it tucks itself back into the orb. Tapping
// it asks Zest the matching question. No close button: it leaves on its own.

export function ZestNudge({ say, ask, onAsk, stay = 8000 }: { say: string; ask: string; onAsk: () => void; stay?: number }) {
  const [phase, setPhase] = useState<"typing" | "saying" | "leaving" | "gone">("typing");
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = [setTimeout(() => setPhase("saying"), still ? 0 : 900), setTimeout(() => setPhase("leaving"), stay), setTimeout(() => setPhase("gone"), stay + 300)];
    return () => t.forEach(clearTimeout);
  }, [stay]);
  if (phase === "gone") return null;
  return (
    <button type="button" onClick={onAsk} className={`zb relative mb-2 mr-1 max-w-[min(290px,calc(100vw-100px))] rounded-[20px] px-4 py-3 text-left text-[14px] font-medium leading-snug text-[#f1f1ec] sm:text-[15px] ${phase === "leaving" ? "is-leaving" : ""}`}>
      <span className="sr-only">{ask}</span>
      {phase === "typing" ? (
        <span aria-hidden className="zb-dots flex h-5 items-center">
          <i />
          <i />
          <i />
        </span>
      ) : (
        <span aria-hidden>
          {say.split(" ").map((w, i) => (
            <span key={i} className="zb-word" style={{ animationDelay: `${i * 55}ms` }}>
              {w}&nbsp;
            </span>
          ))}
        </span>
      )}
    </button>
  );
}
