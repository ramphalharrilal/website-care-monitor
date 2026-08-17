import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function safePath(pathname) {
  try {
    const decoded = decodeURIComponent(pathname.split("?")[0]);
    const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
    const normalized = normalize(relative);
    if (normalized.startsWith("..") || normalized.includes("\0")) return null;
    return join(publicDirectory, normalized);
  } catch {
    return null;
  }
}

export function createSiteCareServer() {
  return createServer(async (request, response) => {
    response.setHeader("content-security-policy", "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:");
    response.setHeader("x-content-type-options", "nosniff");
    response.setHeader("x-frame-options", "DENY");
    response.setHeader("referrer-policy", "no-referrer");

    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { allow: "GET, HEAD" });
      return response.end("Method not allowed");
    }

    if (request.url === "/api/health") {
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      if (request.method === "HEAD") return response.end();
      return response.end(JSON.stringify({ service: "SiteCare", status: "ok" }));
    }

    const filePath = safePath(request.url ?? "/");
    if (!filePath) {
      response.writeHead(400);
      return response.end("Bad request");
    }

    try {
      const details = await stat(filePath);
      if (!details.isFile()) throw new Error("Not a file");
      response.writeHead(200, { "content-type": mimeTypes[extname(filePath)] ?? "application/octet-stream" });
      if (request.method === "HEAD") return response.end();
      createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000);
  createSiteCareServer().listen(port, () => {
    console.log(`SiteCare demo running at http://localhost:${port}`);
  });
}
