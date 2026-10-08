import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.join(projectRoot, "frontend");
const preferredPort = Number(process.env.PORT || 8080);
const maxPortAttempts = 20;
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = http.createServer((request, response) => {
    const requestPath = decodeURIComponent((request.url || "/").split("?")[0]);
    const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
    const filePath = path.resolve(root, relativePath);

    if (!filePath.startsWith(`${root}${path.sep}`) && filePath !== root) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, content) => {
      if (error) {
        response.writeHead(error.code === "ENOENT" ? 404 : 500).end("Not found");
        return;
      }
      response.setHeader("Content-Type", contentTypes[path.extname(filePath)] || "application/octet-stream");
      response.end(content);
    });
  });

let port = preferredPort;
let attempts = 0;

server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && attempts < maxPortAttempts) {
    const occupiedPort = port;
    port += 1;
    attempts += 1;
    console.warn(`Port ${occupiedPort} is already in use. Trying port ${port}...`);
    setTimeout(() => server.listen(port, "127.0.0.1"), 100);
    return;
  }

  console.error("CampusDAO preview server could not start:", error);
  process.exitCode = 1;
});

server.on("listening", () => {
  console.log(`CampusDAO is available at http://127.0.0.1:${port}`);
  console.log("Keep this PowerShell window open. Press Ctrl+C to stop the server.");
});

server.listen(port, "127.0.0.1");
