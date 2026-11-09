import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

function sha256(filePath: string) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase();
}

describe("permanent owner asset locks", () => {
  it("ships the owner-approved Homepage film without changing a single byte", () => {
    const file = "public/media/homepage/hero-h3-2.mp4";
    expect(statSync(file).size).toBe(1761848);
    expect(sha256(file)).toBe(
      "FC9DE024524B299003AEE507798F4A89BDAF635C87EF0EF3770DD29AB94BD421",
    );
  });

  it("ships the approved Homepage poster without changing a single byte", () => {
    const file = "public/media/homepage/hero-h3-2-poster.png";
    expect(statSync(file).size).toBe(866844);
    expect(sha256(file)).toBe(
      "98F88281993C94425BBC6D6E3FF7EF7E621650A05213EC48937BAD60B691CC69",
    );
  });

  it("keeps the official PODIUM EDS logo untouched", () => {
    expect(sha256("public/logo/logo.png")).toBe(
      "226AB6F1D80A4337F3120069E03AE361A73DF115C5463F5584D4643A9036ACD2",
    );
    expect(sha256("public/logo/logo-compact.png")).toBe(
      "424A28BFD473EE664D051E8F127A51BE84C53E1B62753C510A8CFE09A8176125",
    );
  });
});
