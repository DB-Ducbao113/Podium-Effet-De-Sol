import { useEffect, useRef, useState } from "react";

const IMG_W = 2048;
const IMG_H = 1152;

const TRAIL_LANES = [
  { y0: 0.52, y1: 0.15, color: "190,240,255" },
  { y0: 0.535, y1: 0.28, color: "90,190,255" },
  { y0: 0.55, y1: 0.39, color: "140,220,255" },
  { y0: 0.56, y1: 0.46, color: "60,160,240" },
] as const;

interface Trail {
  lane: (typeof TRAIL_LANES)[number];
  x: number;
  len: number;
  v: number;
  w: number;
}

interface Drop {
  x: number;
  y: number;
  v: number;
  l: number;
  a: number;
}

interface Ring {
  x: number;
  y: number;
  r: number;
  max: number;
}

export interface StormHeroBackdropProps {
  readonly reducedMotion: boolean;
  readonly variant?: "hero" | "tabs";
  /** Calms particle/trail animation on data-reading tabs when scrolled or coarse-pointer (`BR-14`). */
  readonly calmParticles?: boolean;
}

/**
 * Production Storm Midnight Living-Photo Backdrop (`REQ-01`, `REQ-14`, `BR-03`).
 * - Uses responsive `<picture>` (`AVIF` + `WebP` at `960w`, `1600w`, `2048w`) from `/images/storm/`
 *   with zero DEV-only asset gates (`>= 40%` transfer reduction vs raw JPGs).
 * - Immediately pauses `requestAnimationFrame` when `document.hidden` or off-screen, and reduces
 *   particle work on mobile / coarse-pointer / data-reading views.
 */
export function StormHeroBackdrop({
  reducedMotion,
  variant = "hero",
  calmParticles = false,
}: StormHeroBackdropProps) {
  const isHero = variant === "hero";
  const baseId = isHero ? "storm-hero" : "storm-tabs";
  const avifSrcSet = `/images/storm/${baseId}-960.avif 960w, /images/storm/${baseId}-1600.avif 1600w, /images/storm/${baseId}-2048.avif 2048w`;
  const webpSrcSet = `/images/storm/${baseId}-960.webp 960w, /images/storm/${baseId}-1600.webp 1600w, /images/storm/${baseId}-2048.webp 2048w`;
  const fallbackWebp = `/images/storm/${baseId}-1600.webp`;
  const reflWebp = `/images/storm/${baseId}-960.webp`;

  const stageRef = useRef<HTMLDivElement>(null);
  const parRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const reflWrapRef = useRef<HTMLDivElement>(null);
  const reflImgRef = useRef<HTMLImageElement>(null);

  const [imgFailed, setImgFailed] = useState(false);
  const canShowReflection =
    isHero &&
    !imgFailed &&
    !reducedMotion &&
    (typeof window === "undefined" ||
      (window.innerWidth > 860 &&
        !(
          typeof window.matchMedia === "function" &&
          window.matchMedia("(pointer: coarse)").matches
        )));

  useEffect(() => {
    const stage = stageRef.current;
    const par = parRef.current;
    const canvas = canvasRef.current;
    const pulse = pulseRef.current;
    const reflWrap = reflWrapRef.current;
    const reflImg = reflImgRef.current;
    if (!stage || !par || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isCoarsePointer =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    const saveData = Boolean(
      (
        navigator as Navigator & {
          connection?: { saveData?: boolean };
        }
      ).connection?.saveData,
    );

    let scale = 1;
    let ox = 0;
    let oy = 0;
    let cw = 0;
    let ch = 0;
    let isMobile = false;

    const updateCover = () => {
      // Read viewport dimensions directly (stage is fixed 100vw x 100dvh) to avoid forced reflow.
      cw =
        (typeof window !== "undefined" ? window.innerWidth : 0) ||
        par.clientWidth ||
        stage.clientWidth ||
        1440;
      ch =
        (typeof window !== "undefined" ? window.innerHeight : 0) ||
        par.clientHeight ||
        stage.clientHeight ||
        900;
      isMobile = typeof window !== "undefined" && window.innerWidth <= 860;
      const px = isMobile ? 0.72 : 0.5;
      const py = 0.5;
      scale = Math.max(cw / IMG_W, ch / IMG_H);
      ox = (cw - IMG_W * scale) * px;
      oy = (ch - IMG_H * scale) * py;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5);
      canvas.width = Math.max(1, Math.round(cw * dpr));
      canvas.height = Math.max(1, Math.round(ch * dpr));

      if (pulse) {
        pulse.style.left = `${ox + 0.879 * IMG_W * scale}px`;
        pulse.style.top = `${oy + 0.485 * IMG_H * scale}px`;
      }

      if (reflWrap && reflImg) {
        if (
          reducedMotion ||
          isMobile ||
          isCoarsePointer ||
          imgFailed ||
          !isHero
        ) {
          reflWrap.style.display = "none";
        } else {
          const yh = oy + 0.752 * IMG_H * scale;
          reflWrap.style.display = "block";
          reflWrap.style.top = `${yh}px`;
          reflWrap.style.height = `${Math.max(0, ch - yh)}px`;
          reflImg.style.width = `${IMG_W * scale}px`;
          reflImg.style.height = `${IMG_H * scale}px`;
          reflImg.style.left = `${ox}px`;
          reflImg.style.top = `${2 * yh - oy - IMG_H * scale - yh}px`;
        }
      }
    };

    let drops: Drop[] = [];
    const seedRain = () => {
      drops = [];
      if (reducedMotion || saveData || (calmParticles && isCoarsePointer)) {
        return;
      }
      const count = isMobile || isCoarsePointer ? 26 : calmParticles ? 48 : 96;
      for (let i = 0; i < count; i++) {
        drops.push({
          x: Math.random() * (IMG_W + 200) - 100,
          y: Math.random() * IMG_H,
          v: 950 + Math.random() * 550,
          l: 13 + Math.random() * 15,
          a: 0.08 + Math.random() * 0.2,
        });
      }
    };

    let initRafId: number | null = null;
    let rafId: number | null = null;
    let running = false;
    let last = 0;
    let intersecting = true;
    const minFrameIntervalMs = calmParticles ? 30 : 0; // ~33fps on calm data tabs, 60fps on Hero

    if (reducedMotion || saveData || (calmParticles && isCoarsePointer)) {
      initRafId = window.requestAnimationFrame(() => {
        initRafId = null;
        updateCover();
        par.style.transform = "translate3d(0, 0, 0)";
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
      return () => {
        if (initRafId !== null) window.cancelAnimationFrame(initRafId);
      };
    }

    let trails: Trail[] = [];
    let spawnIn = 0.25;
    let rings: Ring[] = [];
    let ringIn = 0.35;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let pointerEngaged = false;
    const t0 = performance.now();

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerEngaged = true;
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      tx = (event.clientX / vw - 0.5) * -12;
      ty = (event.clientY / vh - 0.5) * -8;
    };

    const yAt = (lane: (typeof TRAIL_LANES)[number], x: number) =>
      (lane.y0 + (lane.y1 - lane.y0) * (x / IMG_W)) * IMG_H;

    const maxTrails = calmParticles ? 2 : 4;

    const drawTrails = (dt: number) => {
      spawnIn -= dt;
      if (spawnIn <= 0 && trails.length < maxTrails) {
        const lane =
          TRAIL_LANES[Math.floor(Math.random() * TRAIL_LANES.length)];
        trails.push({
          lane,
          x: -700,
          len: 380 + Math.random() * 300,
          v: 1500 + Math.random() * 800,
          w: 2.4 + Math.random() * 2.8,
        });
        spawnIn = calmParticles
          ? 0.9 + Math.random() * 0.8
          : 0.5 + Math.random() * 0.6;
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(-120, -120, IMG_W + 240, IMG_H + 240);
      if (isHero) {
        ctx.rect(870, 524, 1133, 354);
      }
      ctx.clip("evenodd");

      for (const t of trails) {
        t.x += t.v * dt;
        const x2 = t.x - t.len;
        const grad = ctx.createLinearGradient(x2, 0, t.x, 0);
        grad.addColorStop(0, `rgba(${t.lane.color},0)`);
        grad.addColorStop(0.75, `rgba(${t.lane.color},0.55)`);
        grad.addColorStop(1, "rgba(255,255,255,0.95)");
        ctx.strokeStyle = grad;
        ctx.lineCap = "round";

        ctx.lineWidth = t.w * 2.5;
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.moveTo(x2, yAt(t.lane, x2));
        ctx.lineTo(t.x, yAt(t.lane, t.x));
        ctx.stroke();

        ctx.lineWidth = t.w;
        ctx.globalAlpha = 0.88;
        ctx.beginPath();
        ctx.moveTo(x2, yAt(t.lane, x2));
        ctx.lineTo(t.x, yAt(t.lane, t.x));
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      trails = trails.filter((t) => t.x - t.len < IMG_W + 80);
    };

    const drawRain = (dt: number) => {
      ctx.strokeStyle = "rgba(190,220,255,1)";
      ctx.lineCap = "round";
      for (const d of drops) {
        d.y += d.v * dt;
        d.x -= d.v * 0.16 * dt;
        if (d.y > IMG_H + 30) {
          d.y = -30;
          d.x = Math.random() * (IMG_W + 200) - 100;
        }
        ctx.globalAlpha = d.a;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.l * 0.16, d.y + d.l);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const drawRings = (dt: number) => {
      ringIn -= dt;
      if (ringIn <= 0 && rings.length < 10) {
        rings.push({
          x: Math.random() * IMG_W,
          y: (0.78 + Math.random() * 0.2) * IMG_H,
          r: 5,
          max: 20 + Math.random() * 15,
        });
        ringIn = 0.26 + Math.random() * 0.3;
      }
      for (const g of rings) {
        g.r += dt * 26;
        const t = g.r / g.max;
        ctx.globalAlpha = Math.max(0, (1 - t) * 0.2);
        ctx.strokeStyle = "rgba(170,225,255,1)";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(g.x, g.y, g.r, g.r * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      rings = rings.filter((g) => g.r < g.max);
    };

    const frame = (ts: number) => {
      if (!running) return;
      if (minFrameIntervalMs > 0 && ts - last < minFrameIntervalMs) {
        rafId = window.requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;

      if (!pointerEngaged) {
        tx = Math.sin((ts - t0) / 5200) * 4.5;
        ty = Math.cos((ts - t0) / 6100) * 2.6;
      }
      cx += (tx - cx) * 0.045;
      cy += (ty - cy) * 0.045;
      par.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;

      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.translate(ox, oy);
      ctx.scale(scale, scale);
      drawTrails(dt);
      drawRain(dt);
      if (isHero) {
        drawRings(dt);
      }

      rafId = window.requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const syncRunState = () => {
      if (document.hidden || !intersecting) {
        stop();
      } else if (!running) {
        running = true;
        last = performance.now();
        rafId = window.requestAnimationFrame(frame);
      }
    };

    const onResize = () => {
      updateCover();
      seedRain();
    };

    if (!isCoarsePointer) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", syncRunState);

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver((entries) => {
        intersecting = entries[0]?.isIntersecting ?? true;
        syncRunState();
      });
      observer.observe(stage);
    }

    initRafId = window.requestAnimationFrame(() => {
      initRafId = null;
      updateCover();
      seedRain();
      syncRunState();
    });

    return () => {
      if (initRafId !== null) window.cancelAnimationFrame(initRafId);
      stop();
      observer?.disconnect();
      if (!isCoarsePointer) {
        window.removeEventListener("pointermove", onPointerMove);
      }
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", syncRunState);
    };
  }, [calmParticles, imgFailed, isHero, reducedMotion]);

  return (
    <div
      ref={stageRef}
      className={`sp-storm-stage ${isHero ? "" : "is-fixed-tabs-stage"}`}
      data-storm-motion={reducedMotion ? "reduced" : "active"}
      data-storm-variant={variant}
      aria-hidden="true"
    >
      <div ref={parRef} className="sp-storm-par">
        <div className="sp-storm-css-fallback" />
        {!imgFailed ? (
          <picture>
            <source type="image/avif" srcSet={avifSrcSet} sizes="100vw" />
            <source type="image/webp" srcSet={webpSrcSet} sizes="100vw" />
            <img
              ref={imgRef}
              className="sp-storm-img"
              src={fallbackWebp}
              alt=""
              {...({ fetchpriority: isHero ? "high" : "auto" } as Record<
                string,
                string
              >)}
              decoding="async"
              onError={() => setImgFailed(true)}
            />
          </picture>
        ) : null}

        <canvas ref={canvasRef} className="sp-storm-fx-canvas" />

        {isHero && !reducedMotion ? (
          <div ref={pulseRef} className="sp-storm-rain-pulse" />
        ) : null}

        <div ref={reflWrapRef} className="sp-storm-refl-wrap">
          <div className="sp-storm-refl-drift">
            {canShowReflection ? (
              <img
                ref={reflImgRef}
                src={reflWebp}
                alt=""
                loading="lazy"
                decoding="async"
              />
            ) : null}
          </div>
        </div>
      </div>
      <div className="sp-storm-vignette" />
    </div>
  );
}
