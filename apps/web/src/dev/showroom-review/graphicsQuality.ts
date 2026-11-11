export type GraphicsMode = "auto" | "high" | "balanced" | "performance";

export function resolveGraphicsQuality(
  mode: GraphicsMode,
  softwareRenderer: boolean,
) {
  const effective =
    softwareRenderer || mode === "performance"
      ? "performance"
      : mode === "high"
        ? "high"
        : "balanced";
  const dpr: number | [number, number] =
    effective === "performance"
      ? 0.65
      : effective === "high"
        ? [1, 1.5]
        : [1, 1.25];

  return {
    effective,
    dpr,
    lowPower: effective === "performance",
  };
}
