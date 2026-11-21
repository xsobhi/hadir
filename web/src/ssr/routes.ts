// Which API responses each page needs on first paint, and who may see it. The SSR server fetches these with the
// visitor's own cookie, so the HTML arrives filled in; the browser then reuses the same responses when it hydrates.
export type Access = "public" | "guest" | "private";
type Rule = { pattern: RegExp; access: Access; data: (m: RegExpMatchArray) => string[] };

const shell = "/api/courses";
const RULES: Rule[] = [
  { pattern: /^\/app\/settings$/, access: "private", data: () => [shell] },
  { pattern: /^\/$/, access: "guest", data: () => [] },
  { pattern: /^\/sign(in|up)$/, access: "guest", data: () => [] },
  { pattern: /^\/app$/, access: "private", data: () => ["/api/overview", shell] },
  { pattern: /^\/app\/courses\/new$/, access: "private", data: () => [shell] },
  { pattern: /^\/app\/courses\/(\d+)$/, access: "private", data: (m) => [`/api/courses/${m[1]}`, shell] },
  { pattern: /^\/app\/cards\/(\d+)$/, access: "private", data: (m) => [`/api/courses/${m[1]}`, shell] },
  { pattern: /^\/app\/live\/(\d+)$/, access: "private", data: (m) => [`/api/sessions/${m[1]}`, shell] },
  { pattern: /^\/app\/students$/, access: "private", data: () => ["/api/students", shell] },
  { pattern: /^\/app\/students\/(\d+)$/, access: "private", data: (m) => [`/api/students/${m[1]}`, shell] },
  { pattern: /^\/app\/assistant$/, access: "private", data: () => ["/api/assistant/threads", shell] },
  { pattern: /^\/app\/assistant\/([a-f0-9]{8,64})$/, access: "private",
    data: (m) => ["/api/assistant/threads", `/api/assistant/threads/${m[1]}`, shell] },
];

export function matchRoute(pathname: string): { access: Access; data: string[] } | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  for (const rule of RULES) {
    const m = path.match(rule.pattern);
    if (m) return { access: rule.access, data: ["/api/auth/me", ...rule.data(m)] };
  }
  return null;
}
