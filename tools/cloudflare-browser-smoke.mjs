import { chromium } from "playwright-core";

const baseUrl = process.env.PEDS_CLOUDFLARE_DEV_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ channel: "msedge", headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const pageErrors = [];
const candidateResponses = [];
const httpFailures = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("response", (response) => {
  if (response.status() >= 400)
    httpFailures.push({ status: response.status(), url: response.url() });
  if (response.url().includes("/__peds-review/model-b.glb")) {
    candidateResponses.push({
      status: response.status(),
      contentType: response.headers()["content-type"],
    });
  }
});

try {
  await page.goto(`${baseUrl}/showroom?model=commercial-b`, {
    waitUntil: "domcontentloaded",
  });
  await page
    .getByRole("button", { name: /Cài đặt đồ họa|Graphics Settings/i })
    .waitFor({
      state: "visible",
      timeout: 20_000,
    });
  await page.waitForTimeout(2_000);

  const collapsedText = await page.locator("body").innerText();
  const graphicsButton = page.getByRole("button", {
    name: /Cài đặt đồ họa|Graphics Settings/i,
  });
  await graphicsButton.click();
  const profileLabels = await page
    .getByRole("button", {
      name: /Tự động|Auto|Cao|High|Cân bằng|Balanced|Hiệu năng|Performance/i,
    })
    .allTextContents();
  const canvasState = await page
    .locator("canvas")
    .first()
    .evaluate((canvas) => {
      const webgl2 = canvas.getContext("webgl2");
      const webgl = webgl2 ?? canvas.getContext("webgl");
      return {
        width: canvas.width,
        height: canvas.height,
        hasWebgl: Boolean(webgl),
        renderer: webgl?.getParameter(webgl.RENDERER) ?? null,
      };
    });

  const result = {
    url: page.url(),
    title: await page.title(),
    candidateResponses,
    canvas: canvasState,
    graphicsSettingsVisible: await graphicsButton.isVisible(),
    advancedMetricsCollapsedByDefault:
      !/Advanced Metrics|Chỉ số nâng cao/i.test(collapsedText),
    profileLabels,
    consoleErrors: consoleErrors.filter(
      (message) =>
        !message.includes("fonts.googleapis.com") &&
        !message.includes("ERR_FAILED") &&
        !message.startsWith(
          "Failed to load resource: the server responded with a status of 503",
        ),
    ),
    httpFailures,
    pageErrors,
  };
  console.log(JSON.stringify(result, null, 2));
  if (
    result.candidateResponses.every((response) => response.status !== 200) ||
    !result.canvas.hasWebgl ||
    !result.graphicsSettingsVisible ||
    result.profileLabels.length < 4 ||
    result.consoleErrors.length > 0 ||
    result.httpFailures.some(
      (failure) =>
        failure.status !== 503 ||
        (!failure.url.includes("/api/openf1") &&
          !failure.url.includes("/api/jolpica")),
    ) ||
    result.pageErrors.length > 0
  ) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
