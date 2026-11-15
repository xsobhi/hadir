import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { Root } from "./Root";
import { HeadContext, type Boot } from "./ssr/context";

export { matchRoute } from "./ssr/routes";
export { avatarSvg } from "./components/avatar-svg";

/** Render one page to HTML for the given URL and boot data; returns the markup and the page's title. */
export function render(url: string, boot: Boot): { html: string; title: string } {
  const head = { title: "حاضر · Hadir" };
  const html = renderToString(
    <HeadContext.Provider value={head}>
      <StaticRouter location={url}>
        <Root boot={boot} />
      </StaticRouter>
    </HeadContext.Provider>,
  );
  return { html, title: head.title };
}
