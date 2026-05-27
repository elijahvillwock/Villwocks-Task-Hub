const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = process.cwd();
const dataDir = path.join(root, "data");
const statePath = path.join(dataDir, "task-hub-state.json");
const port = Number(process.env.PORT || 4173);
const appUrl = `http://localhost:${port}`;
const host = "0.0.0.0";
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent(req.url.split("?")[0]);
  if (pathname === "/") pathname = "/index.html";

  if (pathname === "/api/state" && req.method === "GET") {
    sendJson(res, 200, readSharedState());
    return;
  }

  if (pathname === "/api/state" && req.method === "POST") {
    readBody(req, (error, body) => {
      if (error) {
        sendJson(res, 400, { error: error.message });
        return;
      }
      try {
        const nextState = sanitizeSharedState(JSON.parse(body || "{}"));
        writeSharedState(nextState);
        sendJson(res, 200, nextState);
      } catch {
        sendJson(res, 400, { error: "Invalid shared state." });
      }
    });
    return;
  }

  const file = path.join(root, pathname);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer-when-downgrade",
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups"
    });
    res.end(data);
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Close the other local preview or restart your computer, then try again.`);
  } else if (error.code === "EPERM") {
    console.error(`macOS blocked this app from opening ${appUrl}. Try running the launcher again from Terminal, or restart Codex/Terminal and retry.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

function readBody(req, done) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 5_000_000) {
      req.destroy();
      done(new Error("Request is too large."));
    }
  });
  req.on("end", () => done(null, body));
  req.on("error", done);
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function readSharedState() {
  try {
    return sanitizeSharedState(JSON.parse(fs.readFileSync(statePath, "utf8")));
  } catch {
    return { items: [], users: [], invites: [], shortcuts: [], appRequests: [] };
  }
}

function writeSharedState(state) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(sanitizeSharedState(state), null, 2));
}

function sanitizeSharedState(state) {
  return {
    items: Array.isArray(state.items) ? state.items : [],
    users: Array.isArray(state.users) ? state.users : [],
    invites: Array.isArray(state.invites) ? state.invites : [],
    shortcuts: Array.isArray(state.shortcuts) ? state.shortcuts : [],
    appRequests: Array.isArray(state.appRequests) ? state.appRequests : []
  };
}

function localNetworkUrls() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => `http://${item.address}:${port}`);
}

server.listen(port, host, () => {
  console.log(`Preview at ${appUrl}`);
  const urls = localNetworkUrls();
  if (urls.length) {
    console.log("Phone URLs on the same Wi-Fi:");
    urls.forEach((url) => console.log(`  ${url}`));
  }
});
