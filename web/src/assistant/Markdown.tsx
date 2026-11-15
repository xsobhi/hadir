import { Fragment, type ReactNode } from "react";

/** Just enough Markdown for the assistant's answers: paragraphs, **bold**, lists, quotes, headings, rules.
 * Builds React nodes (never raw HTML), so model output cannot inject markup. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>);
}

export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^\s*([-*]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d/.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+[.)])\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+[.)])\s+/, ""));
      const List = ordered ? "ol" : "ul";
      blocks.push(<List key={i} className={ordered ? "md-ol" : "md-ul"}>{items.map((it, k) => <li key={k}>{inline(it)}</li>)}</List>);
      continue;
    }
    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) quote.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push(<blockquote key={i} className="md-quote"><Markdown text={quote.join("\n")} /></blockquote>);
      continue;
    }
    if (/^-{3,}\s*$/.test(line)) { blocks.push(<hr key={i} className="md-hr" />); i++; continue; }
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (heading) { blocks.push(<p key={i} className="md-h">{inline(heading[1])}</p>); i++; continue; }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^\s*([-*]|\d+[.)])\s+|^>|^#{1,4}\s|^-{3,}\s*$/.test(lines[i])) para.push(lines[i++]);
    blocks.push(<p key={i}>{para.map((p, k) => <Fragment key={k}>{k > 0 && <br />}{inline(p)}</Fragment>)}</p>);
  }
  return <div className="md" dir="auto">{blocks}</div>;
}
