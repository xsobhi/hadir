import { Bot, BotSparkle, MessagesSquare } from "kubai-icons-react";
import { ArrowUp, Plus } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApprovalCard } from "../assistant/ApprovalCard";
import { Markdown } from "../assistant/Markdown";
import { Steps } from "../assistant/Steps";
import type { Item, Step } from "../assistant/types";
import { useAssistant } from "../assistant/useAssistant";
import { Shell } from "../components/Shell";
import { Tile } from "../components/ui/Tile";
import { useLang } from "../i18n";

function render(items: Item[], t: ReturnType<typeof useLang>["t"]): ReactNode[] {
  const out: ReactNode[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.kind === "step") {
      const group: Step[] = [];
      while (i < items.length && items[i].kind === "step") group.push(items[i++] as Step);
      i--;
      out.push(<Steps key={`s${i}`} steps={group} />);
      group.filter((s) => s.notice?.text).forEach((s) => out.push(
        <figure key={`n${s.callId}`} className="letter-card">
          <figcaption><strong>{t.assistant.noticeTitle}</strong><span className="muted small">{t.assistant.noticeRounds(s.notice!.rounds)}</span></figcaption>
          <p className="letter" dir="auto">{s.notice!.text}</p>
        </figure>));
    } else if (it.kind === "user") {
      out.push(<p key={i} className="bubble-user" dir="auto">{it.text}</p>);
    } else if (it.kind === "assistant") {
      out.push(<div key={i} className="answer"><span className="answer-avatar" aria-hidden="true"><Bot size={22} color="#f59e0b" trigger="none" /></span><Markdown text={it.text} /></div>);
    } else {
      out.push(<ApprovalCard key={i} actions={it.actions} decided={it.approved} />);
    }
  }
  return out;
}

export default function Assistant() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const { items, pending, streaming, error, threads, send, decide } =
    useAssistant(threadId, (id) => navigate(`/app/assistant/${id}`, { replace: true }));
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    void end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [items, pending]);
  const submit = (e?: FormEvent, value = text) => {
    e?.preventDefault();
    if (!value.trim() || streaming || pending) return;
    setText("");
    void send(value.trim());
  };
  const errorText = error === "limit" ? t.assistant.limit : error === "busy" ? t.assistant.busy : error ? t.assistant.failed : null;
  return (
    <Shell title={t.assistant.title}>
      <div data-reveal className="page-head">
        <div className="card-title" data-kubai-trigger><Tile icon={BotSparkle} tone="amber" size={52} /><div><h1>{t.assistant.title}</h1><p className="lead">{t.assistant.emptyLead}</p></div></div>
        <div className="actions"><Link className="btn btn-soft" to="/app/assistant"><Plus aria-hidden="true" />{t.assistant.newChat}</Link></div>
      </div>
      <div className="chat-layout">
        <aside data-reveal className="card threads" data-lenis-prevent aria-labelledby="threads-h">
          <h2 id="threads-h" className="threads-h"><MessagesSquare size={22} color="#2563eb" trigger="none" />{t.assistant.history}</h2>
          {threads.length === 0 ? <p className="muted small">{t.assistant.noHistory}</p> : (
            <ul className="thread-list">
              {threads.map((th) => (
                <li key={th.id}>
                  <Link to={`/app/assistant/${th.id}`} className={th.id === threadId ? "thread active" : "thread"} dir="auto">{th.title || "…"}</Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <section data-reveal className="card chat" aria-label={t.assistant.title}>
          <div className="chat-scroll" aria-live="polite">
            {items.length === 0 ? (
              <div className="chat-empty">
                <span className="chat-empty-icon" data-kubai-trigger><Bot size={64} color="#f59e0b" trigger="parent" /></span>
                <h2>{t.assistant.emptyTitle}</h2>
                <ul className="examples">
                  {t.assistant.examples.map((ex) => (
                    <li key={ex}><button type="button" className="example" onClick={() => submit(undefined, ex)}>{ex}</button></li>
                  ))}
                </ul>
              </div>
            ) : render(items, t)}
            {pending && <ApprovalCard actions={pending.actions} onDecide={(a) => void decide(a)} busy={streaming} />}
            {streaming && <p className="thinking muted"><span className="pulse" aria-hidden="true" />{t.assistant.thinking}</p>}
            {errorText && <p className="chat-error" role="alert">{errorText}</p>}
            <div ref={end} className="chat-end" />
          </div>
          <form className="composer" onSubmit={submit}>
            <label htmlFor="ask" className="sr-only">{t.assistant.placeholder}</label>
            <textarea id="ask" className="input" rows={2} dir="auto" value={text} placeholder={t.assistant.placeholder} maxLength={2000}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e); }} />
            <button type="submit" className="btn btn-primary icon-btn send" disabled={!text.trim() || streaming || Boolean(pending)} aria-label={t.assistant.send}>
              <ArrowUp aria-hidden="true" />
            </button>
          </form>
        </section>
      </div>
    </Shell>
  );
}
