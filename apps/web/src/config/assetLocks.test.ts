import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function sha256(filePath: string) {
  return createHash("sha256")
    .update(readFileSync(filePath))
    .digest("hex")
    .toUpperCase();
}

describe("permanent owner asset locks & retired media verification", () => {
  it("keeps the official PODIUM EDS logo untouched", () => {
    expect(sha256("public/logo/logo.png")).toBe(
      "226AB6F1D80A4337F3120069E03AE361A73DF115C5463F5584D4643A9036ACD2",
    );
    expect(sha256("public/logo/logo-compact.png")).toBe(
      "424A28BFD473EE664D051E8F127A51BE84C53E1B62753C510A8CFE09A8176125",
    );
  });

  it("retires legacy drift/tunnel videos and Model B from the public asset tree", () => {
    for (const retired of [
      "public/media/homepage/hero-h3-2.mp4",
      "public/media/homepage/hero-h3-2-poster.png",
      "public/media/homepage/f1-hero",
      "public/media/showroom",
      "public/media",
      "public/models/model-b-eds-optimized-v1.glb",
    ]) {
      expect(existsSync(retired), retired).toBe(false);
    }
  });
});
