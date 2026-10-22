"use client";

import { useEffect, useRef, useState } from "react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";
import { HearIt } from "./soundbox";

// The Zest Soundbox "Halo" in 3D: a ray-marched puck with a glowing ring, drawn by one fragment shader
// on a plain WebGL canvas (no libraries). It plays a short order story while on screen, any state can be
// picked, and it turns with a drag. Nothing runs off screen. Without WebGL it shows a still render;
// with reduced motion it doesn't turn or pulse by itself.

const FRAG = `
precision highp float;
uniform vec2 uRes; uniform vec2 uRot;
uniform vec3 uAlb; uniform float uRough; uniform vec3 uLight; uniform float uInt; uniform float uPress;
uniform sampler2D uLogo;
const float R = 1.0; const float HH = 0.25; const float Y0 = 0.075; const float TOP = Y0 + 2.0*HH; const float RG = 0.665;
float sdRCyl(vec3 p, float r, float h, float rb){ vec2 d = vec2(length(p.xz)-r+rb, abs(p.y)-h+rb); return min(max(d.x,d.y),0.0) + length(max(d,0.0)) - rb; }
float sdBox(vec3 p, vec3 b, float r){ vec3 q=abs(p)-b+r; return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0)-r; }
float body(vec3 p){
  float d = sdRCyl(p-vec3(0.0,Y0+HH,0.0), R, HH, 0.11);
  d = min(d, sdRCyl(p-vec3(0.0,0.045,0.0), 0.80, 0.045, 0.02));
  d = max(d, -(length(vec2(length(p.xz)-RG, p.y-TOP)) - 0.032));
  d = max(d, -(length(p-vec3(0.0, TOP+3.0-0.05-uPress, 0.0)) - 3.0));
  float a = -0.85; vec3 q = vec3(cos(a)*p.x - sin(a)*p.z, p.y, sin(a)*p.x + cos(a)*p.z);
  return max(d, -sdBox(q-vec3(R, Y0+HH, 0.0), vec3(0.02,0.012,0.085), 0.012));
}
vec2 map(vec3 p){ float b = body(p); return b < p.y ? vec2(b,1.0) : vec2(p.y,0.0); }
vec3 nrm(vec3 p){ vec2 e = vec2(0.0008,0.0); return normalize(vec3(body(p+e.xyy)-body(p-e.xyy), body(p+e.yxy)-body(p-e.yxy), body(p+e.yyx)-body(p-e.yyx))); }
float shadow(vec3 ro, vec3 rd){ float res=1.0, t=0.02; for(int i=0;i<40;i++){ float h = body(ro+rd*t); res = min(res, 10.0*h/t); t += clamp(h, 0.01, 0.25); if(res<0.001 || t>6.0) break; } return clamp(res,0.0,1.0); }
float ao(vec3 p, vec3 n){ float o=0.0, s=1.0; for(int i=1;i<=5;i++){ float h=0.03*float(i)*float(i)*0.5+0.01; o += (h-map(p+n*h).x)*s; s*=0.7; } return clamp(1.0-2.2*o, 0.0, 1.0); }
float logoA(vec2 uv){ return texture2D(uLogo, uv).a; }
vec3 bgCol(vec2 uv){ float v = 1.0 - 0.75*length(uv - vec2(-0.15,0.15)); return mix(vec3(0.012,0.011,0.010), vec3(0.06,0.055,0.05), clamp(v,0.0,1.0)); }
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;
  vec3 ta = vec3(0.0, 0.18, 0.0);
  vec3 ro = ta + 6.0*vec3(cos(uRot.y)*sin(uRot.x), sin(uRot.y), cos(uRot.y)*cos(uRot.x));
  vec3 ww = normalize(ta-ro), uu = normalize(cross(ww, vec3(0,1,0))), vv = cross(uu, ww);
  vec3 rd = normalize(uv.x*uu + uv.y*vv + 2.05*ww);
  vec3 L = normalize(vec3(-0.55, 1.0, 0.55)); vec3 keyC = vec3(1.0,0.95,0.88)*1.55; vec3 skyC = vec3(0.22,0.21,0.20);
  float t = 0.0; vec2 h = vec2(0.0,-1.0); float glow = 0.0;
  for(int i=0;i<120;i++){
    vec3 p = ro + rd*t; h = map(p);
    glow += exp(-length(vec2(length(p.xz)-RG, p.y-TOP+0.01))*22.0) * 0.018;
    glow += exp(-length(vec2(max(length(p.xz)-0.80,0.0), p.y-0.04))*14.0) * 0.006;
    if(h.x < 0.0004 || t > 14.0) break;
    t += h.x*0.85;
  }
  vec3 col; vec3 bg = bgCol(uv); vec3 p = ro + rd*t;
  if(t < 14.0){
    if(h.y > 0.5){
      vec3 n = nrm(p); vec3 alb = uAlb; float rr = length(p.xz);
      if(rr < 0.5 && n.y > 0.8){
        vec2 luv = vec2(p.x, -p.z)/0.95 + 0.5; float a0 = logoA(luv); float e = 0.0025;
        float gx = logoA(luv+vec2(e,0.0)) - logoA(luv-vec2(e,0.0)); float gy = logoA(luv+vec2(0.0,e)) - logoA(luv-vec2(0.0,e));
        n = normalize(n + vec3(gx, 0.0, -gy)*0.9); alb *= 1.0 - 0.10*a0;
      }
      float dif = clamp(dot(n,L),0.0,1.0); float sh = dif > 0.0 ? shadow(p+n*0.003, L) : 0.0; float o = ao(p, n);
      vec3 hv = normalize(L - rd);
      float spec = pow(clamp(dot(n,hv),0.0,1.0), mix(90.0, 18.0, uRough)) * mix(0.55, 0.12, uRough);
      float fre = pow(1.0 - clamp(dot(n,-rd),0.0,1.0), 5.0);
      col = alb * (keyC*dif*sh + skyC*(0.55+0.45*n.y)*o + vec3(0.06)*o) + keyC*spec*sh;
      col += mix(vec3(0.05), vec3(0.35), n.y*0.5+0.5) * fre * 0.35 * o;
      float inG = exp(-pow((rr-RG)/0.028, 2.0)) * smoothstep(TOP-0.07, TOP-0.005, p.y);
      float spill = exp(-abs(rr-RG)*7.5) * smoothstep(TOP-0.04, TOP, p.y);
      col += uLight*uInt*(inG*1.9 + spill*0.35*alb*2.0);
      col += uLight*uInt*(1.0 - smoothstep(Y0, Y0+0.3, p.y)) * clamp(-n.y*0.5+0.6, 0.0, 1.0)*alb*0.45;
    } else {
      float sh = shadow(p+vec3(0,0.002,0), L); float o = ao(p, vec3(0,1,0));
      col = vec3(0.028,0.025,0.023)*(keyC*clamp(L.y,0.0,1.0)*sh*0.9 + skyC*o);
      float rr = length(p.xz);
      col += uLight*uInt*exp(-max(rr-0.80, 0.0)*2.6) * smoothstep(0.70, 0.86, rr)*0.6;
      col = mix(col, bg, smoothstep(2.5, 8.0, t));
    }
  } else col = bg;
  col += uLight*uInt*glow*1.1;
  col = pow(aces(col*1.05), vec3(1.0/2.2));
  col *= 1.0 - 0.28*dot(uv,uv);
  gl_FragColor = vec4(col, 1.0);
}`;

export type HaloState = "resting" | "order" | "speaking" | "listening" | "done" | "missed";
type Finish = "chalk" | "graphite" | "lime";

const STATES: Record<HaloState, { c: [number, number, number]; f: (t: number) => number; dot: string; name: Bi }> = {
  resting: { c: [1.0, 0.42, 0.06], f: () => 0, dot: "#5a544b", name: { en: "Resting", hi: "आराम में" } },
  order: { c: [1.0, 0.4, 0.05], f: (t) => 0.55 + 0.45 * Math.sin(t * 2.0), dot: "#ff9f1c", name: { en: "New order", hi: "नया ऑर्डर" } },
  speaking: { c: [1.0, 0.45, 0.07], f: (t) => 0.7 + 0.3 * Math.sin(t * 11.0) * Math.sin(t * 3.7), dot: "#ffc24b", name: { en: "Speaking", hi: "बोल रहा है" } },
  listening: { c: [0.85, 0.88, 1.0], f: () => 0.75, dot: "#fff1cf", name: { en: "Listening", hi: "सुन रहा है" } },
  done: { c: [0.1, 0.85, 0.35], f: () => 0.85, dot: "#3ddc84", name: { en: "Accepted", hi: "मंज़ूर" } },
  missed: { c: [1.0, 0.12, 0.06], f: (t) => 0.55 + 0.45 * Math.sin(t * 8.0), dot: "#ff4d3a", name: { en: "Not accepted yet", hi: "अभी मंज़ूर नहीं" } },
};
const FINISHES: Record<Finish, { a: [number, number, number]; r: number; dot: string; name: Bi }> = {
  chalk: { a: [0.7, 0.67, 0.61], r: 0.75, dot: "#e9e3d7", name: { en: "Chalk", hi: "चॉक" } },
  graphite: { a: [0.05, 0.05, 0.05], r: 0.55, dot: "#3a3835", name: { en: "Graphite", hi: "ग्रेफ़ाइट" } },
  lime: { a: [0.5, 0.6, 0.3], r: 0.75, dot: "#a3b76a", name: { en: "Lime", hi: "लाइम" } },
};

// The story it plays by itself: what the box does with one order, and what it says.
const STORY: { state: HaloState; ms: number; says: Bi; clip?: string }[] = [
  { state: "order", ms: 2600, says: { en: "Ring glows: a new order has come in.", hi: "रिंग जलती है: नया ऑर्डर आया है।" } },
  { state: "speaking", ms: 4200, says: { en: "“New order! Two aloo paratha, one rajma chawal. Payment received.”", hi: "“नया ऑर्डर! दो आलू पराठा, एक राजमा चावल। पेमेंट मिल गया।”" }, clip: "new-order" },
  { state: "done", ms: 3000, says: { en: "You press the top: accepted, and the ticket printer prints the KOT.", hi: "आपने ऊपर दबाया: ऑर्डर मंज़ूर, और टिकट प्रिंटर KOT छाप देता है।" }, clip: "accepted" },
  { state: "listening", ms: 3200, says: { en: "Hold the side button: “Rajma is finished for today.”", hi: "साइड बटन दबाकर: “आज राजमा ख़त्म।”" } },
  { state: "missed", ms: 3000, says: { en: "Not accepted in 2 minutes? It gets louder, then calls your phone.", hi: "2 मिनट में मंज़ूर नहीं? आवाज़ तेज़, फिर आपके फ़ोन पर कॉल।" } },
  { state: "resting", ms: 2200, says: { en: "Quiet until the next order.", hi: "अगले ऑर्डर तक शांत।" } },
];

export function Halo3D() {
  const { pick } = useApp();
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ state: "order" as HaloState, finish: "chalk" as Finish, pressAt: -9 });
  const [beat, setBeat] = useState(0);
  const [auto, setAuto] = useState(true);
  const [state, setState] = useState<HaloState>("order");
  const [finish, setFinish] = useState<Finish>("chalk");
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);

  live.current.state = state;
  live.current.finish = finish;

  // Is it on screen?
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "120px" });
    if (wrap.current) io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  // The story, while on screen and until someone picks a state.
  useEffect(() => {
    if (!auto || !visible) return;
    const b = STORY[beat];
    setState(b.state);
    if (b.state === "done") live.current.pressAt = performance.now() / 1000;
    const t = setTimeout(() => setBeat((beat + 1) % STORY.length), b.ms);
    return () => clearTimeout(t);
  }, [beat, auto, visible]);

  // The renderer: set up once on first view, draw only while on screen.
  const started = useRef(false);
  const run = useRef<{ start: () => void; stop: () => void } | null>(null);
  useEffect(() => {
    if (!visible) {
      run.current?.stop();
      return;
    }
    if (!started.current) {
      started.current = true;
      run.current = setup(canvas.current!, live.current);
      if (!run.current) {
        setFailed(true);
        return;
      }
    }
    run.current?.start();
    return () => run.current?.stop();
  }, [visible]);

  function pickState(s: HaloState) {
    setAuto(false);
    setState(s);
    if (s === "done") live.current.pressAt = performance.now() / 1000;
  }

  const says = auto ? STORY[beat] : STORY.find((b) => b.state === state) ?? STORY[0];

  return (
    <div ref={wrap} className="overflow-hidden rounded-[28px] bg-[#0e0d0c] text-[#efe9df]">
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
        {failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/soundbox/halo.jpg" alt={pick({ en: "The Zest Soundbox: a round chalk-coloured box with a glowing orange ring", hi: "Zest Soundbox: चॉक रंग का गोल डिब्बा, जिसकी नारंगी रिंग जल रही है" })} className="size-full object-cover" />
        ) : (
          <canvas
            ref={canvas}
            role="img"
            aria-label={pick({ en: `The Zest Soundbox, 3D. ${STATES[state].name.en}. Drag to turn it.`, hi: `Zest Soundbox, 3D. ${STATES[state].name.hi}. घुमाने के लिए खींचिए।` })}
            className="absolute inset-0 size-full cursor-grab touch-pan-y active:cursor-grabbing"
          />
        )}
        <p className="pointer-events-none absolute left-5 top-4 text-[13px] text-[#a39a8c]">{pick({ en: "Concept render · drag to turn", hi: "कॉन्सेप्ट रेंडर · घुमाने के लिए खींचिए" })}</p>
      </div>

      <div className="border-t border-[#2e2b27] px-5 pb-5 pt-4">
        <div className="flex min-h-[4.5em] flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <p key={`${says.state}-${says.says.en}`} className="lp-arrive max-w-[52ch] text-[17px] font-medium leading-snug" aria-live="polite">
            {pick(says.says)}
          </p>
          <HearIt clip={says.clip} dark />
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={pick({ en: "What the light means", hi: "रोशनी का मतलब" })}>
          {(Object.keys(STATES) as HaloState[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={k === state}
              onClick={() => pickState(k)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-[14px] transition-colors ${k === state ? "bg-[#efe9df] text-[#161412]" : "bg-[#1e1c19] text-[#b8afa1] hover:text-[#efe9df]"}`}
            >
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: STATES[k].dot }} />
              {pick(STATES[k].name)}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label={pick({ en: "Colour", hi: "रंग" })}>
          <span className="mr-1 text-[13px] text-[#a39a8c]">{pick({ en: "Colour", hi: "रंग" })}</span>
          {(Object.keys(FINISHES) as Finish[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={k === finish}
              onClick={() => setFinish(k)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-[14px] transition-colors ${k === finish ? "bg-[#efe9df] text-[#161412]" : "bg-[#1e1c19] text-[#b8afa1] hover:text-[#efe9df]"}`}
            >
              <span aria-hidden className="size-2.5 rounded-full ring-1 ring-[#5a544b]" style={{ background: FINISHES[k].dot }} />
              {pick(FINISHES[k].name)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Compiles the shader and wires drag-to-turn. Returns null when WebGL isn't there. */
function setup(cv: HTMLCanvasElement, live: { state: HaloState; finish: Finish; pressAt: number }) {
  const gl = cv.getContext("webgl", { antialias: false, preserveDrawingBuffer: false });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = sh(gl.VERTEX_SHADER, "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}");
  const fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const pr = gl.createProgram()!;
  gl.attachShader(pr, vs);
  gl.attachShader(pr, fs);
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(pr, n);
  const u = { res: U("uRes"), rot: U("uRot"), alb: U("uAlb"), rough: U("uRough"), light: U("uLight"), int: U("uInt"), press: U("uPress"), logo: U("uLogo") };

  // The "zest" wordmark pressed into the top, drawn in the page's own font.
  const lc = document.createElement("canvas");
  lc.width = lc.height = 1024;
  const lx = lc.getContext("2d")!;
  lx.fillStyle = "#fff";
  lx.textAlign = "center";
  lx.textBaseline = "middle";
  lx.font = `600 170px ${getComputedStyle(document.body).fontFamily}`;
  lx.filter = "blur(3px)";
  lx.fillText("zest", 512, 520);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lc);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(u.logo, 0);

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let yaw = 0.35, pitch = 0.52, idle = 0;
  let drag: { x: number; y: number; yaw: number; pitch: number } | null = null;
  const cur = { c: [...STATES[live.state].c], a: [...FINISHES[live.finish].a], r: FINISHES[live.finish].r, i: 0 };

  // Horizontal drags turn it; vertical drags still scroll the page on phones (touch-action: pan-y).
  cv.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, yaw, pitch };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener("pointermove", (e) => {
    if (!drag) return;
    yaw = drag.yaw - (e.clientX - drag.x) * 0.006;
    pitch = Math.min(1.25, Math.max(0.12, drag.pitch + (e.clientY - drag.y) * 0.004));
    idle = 0;
  });
  const end = () => (drag = null);
  cv.addEventListener("pointerup", end);
  cv.addEventListener("pointercancel", end);

  // Ray marching is heavy: draw at no more than 1x, and less on small screens.
  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 1) * (cv.clientWidth < 640 ? 0.8 : 1);
    cv.width = Math.floor(cv.clientWidth * scale);
    cv.height = Math.floor(cv.clientHeight * scale);
    gl.viewport(0, 0, cv.width, cv.height);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(cv);
  resize();

  let raf = 0, last = performance.now() / 1000;
  const frame = () => {
    const t = performance.now() / 1000, dt = Math.min(0.05, t - last);
    last = t;
    if (!drag && !still && (idle += dt) > 2.5) yaw += dt * 0.12;
    const S = STATES[live.state], F = FINISHES[live.finish], k = 1 - Math.exp(-dt * 6);
    for (let j = 0; j < 3; j++) {
      cur.c[j] += (S.c[j] - cur.c[j]) * k;
      cur.a[j] += (F.a[j] - cur.a[j]) * k;
    }
    cur.r += (F.r - cur.r) * k;
    const target = still ? S.f(0.8) : Math.max(0, S.f(t));
    cur.i += (target - cur.i) * (1 - Math.exp(-dt * 9));
    const pt = t - live.pressAt;
    gl.uniform2f(u.res, cv.width, cv.height);
    gl.uniform2f(u.rot, yaw, pitch);
    gl.uniform3fv(u.alb, cur.a);
    gl.uniform1f(u.rough, cur.r);
    gl.uniform3fv(u.light, cur.c);
    gl.uniform1f(u.int, Math.max(0, cur.i));
    gl.uniform1f(u.press, pt >= 0 && pt < 0.35 ? 0.012 * Math.sin((Math.PI * pt) / 0.35) : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  };
  return {
    start: () => {
      cancelAnimationFrame(raf);
      last = performance.now() / 1000;
      raf = requestAnimationFrame(frame);
    },
    stop: () => cancelAnimationFrame(raf),
  };
}
