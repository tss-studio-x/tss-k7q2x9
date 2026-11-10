// Top Snap Studio: serves template files from the browser cache after the first visit.
const V = new URL(self.location).searchParams.get("v") || "0";
const CACHE = "tss-" + V;
const LIVE = /(?:^|\/)(?:index\.html|app\.js|sw\.js|preload\.json)?$/;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

async function ranged(res, range) {
  const buf = await res.arrayBuffer(), n = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  let a = m && m[1] ? +m[1] : 0, b = m && m[2] ? +m[2] : n - 1;
  if (m && !m[1] && m[2]) { a = Math.max(0, n - +m[2]); b = n - 1; }
  b = Math.min(b, n - 1);
  if (a > b) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + n } });
  const h = new Headers(res.headers);
  h.set("Content-Range", `bytes ${a}-${b}/${n}`);
  h.set("Content-Length", String(b - a + 1));
  h.set("Accept-Ranges", "bytes");
  return new Response(buf.slice(a, b + 1), { status: 206, statusText: "Partial Content", headers: h });
}

self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope).pathname;
  const path = u.pathname.startsWith(scope) ? u.pathname.slice(scope.length) : u.pathname;
  if (LIVE.test(path) && !u.search) return;
  e.respondWith((async () => {
    let c;
    try { c = await caches.open(CACHE); } catch (_) { return fetch(r); }
    const key = u.origin + u.pathname + u.search;
    const hit = await c.match(key);
    const range = r.headers.get("range");
    if (hit) return range ? ranged(hit, range) : hit;
    if (range) return fetch(r);
    const res = await fetch(r);
    if (res.ok && res.status === 200 && res.type === "basic") c.put(key, res.clone()).catch(() => {});
    return res;
  })());
});
