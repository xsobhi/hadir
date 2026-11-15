// Hadir's web server: renders each page with React on the server (data fetched from the Python API with the
// visitor's own cookie), serves the built assets, and in local development also proxies /api to the backend.
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(process.env.HADIR_WEB_DIST ?? fileURLToPath(new URL("./dist", import.meta.url)));
const CLIENT = join(ROOT, "client");
const API = process.env.HADIR_API_ORIGIN ?? "http://127.0.0.1:3070";
const PORT = Number(process.env.PORT ?? 3071);
const PROXY_API = process.env.HADIR_PROXY_API === "1";
const TEMPLATE = readFileSync(join(CLIENT, "index.html"), "utf8");
const { render, matchRoute, avatarSvg } = await import(pathToFileURL(join(ROOT, "server", "entry-server.js")).href);
const TYPES = { ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".woff": "font/woff", ".wasm": "application/wasm", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json" };

function cookies(req) {
  return Object.fromEntries((req.headers.cookie ?? "").split(";").map((c) => c.trim().split("=")).filter((p) => p[0])
    .map(([k, ...v]) => [k, decodeURIComponent(v.join("="))]));
}

function serveStatic(req, res, pathname) {
  const file = normalize(join(CLIENT, decodeURIComponent(pathname)));
  if (!file.startsWith(CLIENT) || pathname === "/" || pathname.endsWith(".html") || !existsSync(file) || !statSync(file).isFile()) return false;
  const immutable = pathname.startsWith("/assets/");
  res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
    "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "public, max-age=3600" });
  createReadStream(file).pipe(res);
  return true;
}

async function fetchData(paths, req) {
  const headers = { cookie: req.headers.cookie ?? "", "user-agent": "hadir-ssr", accept: "application/json" };
  const out = {};
  await Promise.all(paths.map(async (p) => {
    try {
      const r = await fetch(API + p, { headers, signal: AbortSignal.timeout(8000) });
      if (r.ok) out[p] = await r.json();
      else if (p === "/api/auth/me") out[p] = null; // known: not signed in
    } catch { /* leave it out: the browser fetches it after hydration */ }
  }));
  return out;
}

function proxy(req, res) {
  const target = new URL(API);
  const up = http.request({ host: target.hostname, port: target.port, path: req.url, method: req.method,
    headers: { ...req.headers, host: target.host } }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
  up.on("error", () => { res.writeHead(502); res.end(); });
  req.pipe(up);
}

const escapeJson = (v) => JSON.stringify(v).replace(/[<\u2028\u2029]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

async function page(req, res, url) {
  const route = matchRoute(url.pathname);
  if (!route) { res.writeHead(302, { Location: "/" }); return res.end(); }
  const data = await fetchData(route.data, req);
  const signedIn = Boolean(data["/api/auth/me"]?.user);
  if (route.access === "private" && !signedIn) { res.writeHead(302, { Location: "/" }); return res.end(); }
  if (route.access === "guest" && signedIn) { res.writeHead(302, { Location: "/app" }); return res.end(); }
  const c = cookies(req);
  const asked = url.searchParams.get("lang");
  const lang = asked === "en" || asked === "ar" ? asked : c.hadir_lang === "en" ? "en" : "ar";
  const boot = { data, lang, sidebar: c.hadir_sidebar === "collapsed" ? "collapsed" : "open" };
  const { html, title } = render(url.pathname + url.search, boot);
  const doc = TEMPLATE
    .replace('<html lang="ar" dir="rtl">', `<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}">`)
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div><script>window.__HADIR__=${escapeJson(boot)}</script>`);
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", Vary: "Cookie",
    "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "X-Frame-Options": "DENY" });
  res.end(doc);
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://hadir.local");
    if (url.pathname.startsWith("/api/")) {
      if (PROXY_API) return proxy(req, res);
      res.writeHead(404); return res.end();
    }
    if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end(); }
    const face = url.pathname.match(/^\/avatar\/v1\/([fmx])\/([^/]{1,200})\.svg$/);
    if (face) {
      const seed = decodeURIComponent(face[2]).slice(0, 64);
      res.writeHead(200, { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=31536000, immutable" });
      return res.end(avatarSvg(seed, face[1] === "x" ? "" : face[1]));
    }
    if (serveStatic(req, res, url.pathname)) return;
    await page(req, res, url);
  } catch (e) {
    console.error("ssr error", req.url, e);
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Hadir had a problem rendering this page.");
  }
}).listen(PORT, "127.0.0.1", () => console.log(`hadir web on 127.0.0.1:${PORT}, api ${API}`));
