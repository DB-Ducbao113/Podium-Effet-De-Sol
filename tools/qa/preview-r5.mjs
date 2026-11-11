import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";

const repoRoot = process.cwd();
const identityPath = path.join(
  repoRoot,
  "apps",
  "web",
  "src",
  "dev",
  "insideMachineI1",
  "asset-identity.json",
);
const identity = JSON.parse(fs.readFileSync(identityPath, "utf8"));

const candidateDirs = [
  process.env.PEDS_ITM_R5_RUNTIME_DIR,
  path.join(
    repoRoot,
    ".local-assets",
    "inside-the-machine",
    "runtime",
    identity.namespace,
  ),
  path.resolve(
    repoRoot,
    "..",
    "_PEDS_archive",
    ".local-assets",
    "inside-the-machine",
    "runtime",
    identity.namespace,
  ),
].filter(Boolean);

const runtimeDir = candidateDirs.find((dir) => fs.existsSync(dir));
if (!runtimeDir) {
  console.error(
    `Unable to locate R5 runtime assets (${identity.namespace}). Checked:\n${candidateDirs.join("\n")}`,
  );
  process.exit(1);
}

const vitePort = Number(process.env.PEDS_VITE_PORT || 5173);
const previewPort = Number(process.env.PEDS_PREVIEW_PORT || 5174);
const assetMap = new Map(
  Object.values(identity.assets).map((entry) => [entry.file, entry]),
);

const viteBin = path.join(repoRoot, "node_modules", "vite", "bin", "vite.js");
const viteProc = spawn(
  process.execPath,
  [viteBin, "--host", "127.0.0.1", "--port", String(vitePort), "--strictPort"],
  {
    cwd: path.join(repoRoot, "apps", "web"),
    stdio: "inherit",
  },
);

async function waitForVite() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${vitePort}/`);
      if (res.ok) return;
    } catch {
      // retry until Vite listens
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  throw new Error(`Vite DEV server did not start on port ${vitePort}`);
}

const proxyServer = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${previewPort}`);
  const prefix = `/__itm-i2/${identity.namespace}/`;

  if (url.pathname.startsWith(prefix)) {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Method not allowed");
      return;
    }
    const fetchSite = String(req.headers["sec-fetch-site"] || "").toLowerCase();
    if (fetchSite === "cross-site") {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Cross-origin asset access denied");
      return;
    }
    const fileName = path.basename(url.pathname);
    const meta = assetMap.get(fileName);
    const filePath = path.join(runtimeDir, fileName);
    if (!meta || !fs.existsSync(filePath)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("R5 runtime asset not found");
      return;
    }
    const data = fs.readFileSync(filePath);
    const sha256 = crypto
      .createHash("sha256")
      .update(data)
      .digest("hex")
      .toUpperCase();
    if (sha256 !== meta.sha256) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Asset SHA-256 verification failed");
      return;
    }
    res.writeHead(200, {
      "Content-Type": meta.type,
      "Content-Length": String(data.length),
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, noimageindex, nosnippet",
      "Cross-Origin-Resource-Policy": "same-origin",
    });
    res.end(req.method === "HEAD" ? undefined : data);
    return;
  }

  try {
    const upstream = await fetch(
      `http://127.0.0.1:${vitePort}${url.pathname}${url.search}`,
      {
        method: req.method,
        headers: { ...req.headers, host: `127.0.0.1:${vitePort}` },
      },
    );
    const headers = Object.fromEntries(upstream.headers.entries());
    delete headers["content-encoding"];
    delete headers["content-length"];
    res.writeHead(upstream.status, headers);
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.end(buf);
  } catch (error) {
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(String(error));
  }
});

const shutdown = () => {
  proxyServer.close();
  if (!viteProc.killed) viteProc.kill();
  process.exit(0);
};
proxyServer.on("upgrade", (req, socket, head) => {
  const upstreamSocket = net.connect(vitePort, "127.0.0.1", () => {
    const headerLines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const name = req.rawHeaders[i];
      const value =
        name.toLowerCase() === "host"
          ? `127.0.0.1:${vitePort}`
          : req.rawHeaders[i + 1];
      headerLines.push(`${name}: ${value}`);
    }
    upstreamSocket.write(`${headerLines.join("\r\n")}\r\n\r\n`);
    if (head.length > 0) upstreamSocket.write(head);
    socket.pipe(upstreamSocket).pipe(socket);
  });
  upstreamSocket.on("error", () => socket.destroy());
  socket.on("error", () => upstreamSocket.destroy());
});
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await waitForVite();
proxyServer.listen(previewPort, "127.0.0.1", () => {
  console.log(
    `\nPEDS R5 DEV Preview active: http://127.0.0.1:${previewPort}/engineering/inside-the-machine`,
  );
  console.log(
    `Serving verified R5 runtime (${identity.namespace}) from: ${runtimeDir}\n`,
  );
});
