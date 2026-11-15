import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";
import "@fontsource/tajawal/800.css";
import "@fontsource/tajawal/900.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/ui.css";
import "./styles/shell.css";
import "./styles/overview.css";
import "./styles/course.css";
import "./styles/live.css";
import "./styles/people.css";
import "./styles/assistant.css";
import "./styles/public.css";
import "./styles/case.css";
import "./styles/motion.css";
import "./styles/students.css";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Root } from "./Root";
import type { Boot } from "./ssr/context";

// The server rendered this page and left what it fetched in window.__HADIR__; hydrate onto that HTML.
const boot = (window as unknown as { __HADIR__?: Boot }).__HADIR__ ?? { data: {}, lang: "ar", sidebar: "open" };
hydrateRoot(
  document.getElementById("root")!,
  <BrowserRouter>
    <Root boot={boot} />
  </BrowserRouter>,
);
