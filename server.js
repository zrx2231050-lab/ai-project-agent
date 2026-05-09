import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { answerQuestion, generateProjectBrief, runAgentPipeline } from "./src/agentPipeline.js";
import { readUploadedDocument } from "./src/ingest/documentReaders.js";
import { loadState, resetState, saveState } from "./src/storage.js";

const PORT = Number(process.env.PORT || 3000);
const ROOT = fileURLToPath(new URL("./public", import.meta.url));

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname === "/api/state" && request.method === "GET") {
      return sendJson(response, await loadState());
    }

    if (url.pathname === "/api/ingest" && request.method === "POST") {
      const body = await readJson(request);
      const state = await loadState();
      const result = await runAgentPipeline(state, body);
      await saveState(result.state);
      return sendJson(response, result);
    }

    if (url.pathname === "/api/ingest-file" && request.method === "POST") {
      const body = await readJson(request);
      const document = readUploadedDocument(body);
      const state = await loadState();
      const result = await runAgentPipeline(state, document);
      await saveState(result.state);
      return sendJson(response, {
        ...result,
        file: {
          filename: body.filename,
          type: document.type,
          extractedCharacters: document.content.length
        }
      });
    }

    if (url.pathname === "/api/ask" && request.method === "POST") {
      const body = await readJson(request);
      const state = await loadState();
      return sendJson(response, answerQuestion(state, body.question || ""));
    }

    if (url.pathname === "/api/brief" && request.method === "GET") {
      const state = await loadState();
      return sendText(response, generateProjectBrief(state), "text/markdown; charset=utf-8");
    }

    if (url.pathname === "/api/reset" && request.method === "POST") {
      return sendJson(response, await resetState());
    }

    return serveStatic(url.pathname, response);
  } catch (error) {
    console.error(error);
    return sendJson(response, { error: error.message || "Internal server error" }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`AI Project Agent running at http://localhost:${PORT}`);
});

async function serveStatic(pathname, response) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    return sendText(response, "Forbidden", "text/plain; charset=utf-8", 403);
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "content-type": MIME_TYPES[extname(filePath)] || "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
  } catch {
    sendText(response, "Not found", "text/plain; charset=utf-8", 404);
  }
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(response, data, status = 200) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data, null, 2));
}

function sendText(response, text, contentType, status = 200) {
  response.writeHead(status, { "content-type": contentType });
  response.end(text);
}
