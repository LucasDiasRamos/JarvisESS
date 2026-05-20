import { useEffect, useRef, useState } from "react";
import { uid } from "./helpers";

function greetingForNow() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite";
}

function firstNameFromUser(user) {
  const name = user?.nome || user?.name || "";
  return name.trim().split(/\s+/)[0] || "aluno";
}

const RECENT_CONVERSATIONS = [
  { id: "c-active", title: "Sessão atual", when: "agora", active: true },
  { id: "c1", title: "Resumo de Algoritmos", when: "11/05" },
  { id: "c2", title: "Lista de exercícios — Física", when: "08/05" },
  { id: "c3", title: "Plano de estudos para P1", when: "03/05" },
  { id: "c4", title: "Dúvidas de Microeconomia", when: "28/04" },
  { id: "c5", title: "Fichamento — Sociologia", when: "21/04" },
];

export default function ChatScreen({ docs, currentUser, apiBaseUrl }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const scrollRef = useRef(null);
  const firstName = firstNameFromUser(currentUser);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  // Close drawer with Esc
  useEffect(() => {
    if (!sideOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setSideOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sideOpen]);

  const suggestions = [
    "Resuma o capítulo 3 do Cormen",
    "Crie um lembrete para revisar Cálculo na sexta",
    "Quais foram os pontos da aula 07 de derivadas?",
    "Liste 5 questões de revisão sobre microeconomia",
  ];

  async function send(value) {
    const text = (value ?? input).trim();
    if (!text || typing) return;

    const userMsg = { id: uid(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const response = await fetch(`${apiBaseUrl}/jarvis/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          user_id: currentUser?.id || currentUser?.usuario_id || 1,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.resposta || data?.erro || `HTTP ${response.status}`);
      }

      const replyText = data?.resposta || "Não recebi uma resposta do Jarvis.";
      setMessages((m) => [...m, { id: uid(), role: "jarvis", text: replyText }]);
    } catch (error) {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "jarvis",
          text: `Não consegui falar com o Jarvis agora. ${error.message}`,
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function newConversation() {
    setMessages([]);
    setInput("");
    setSideOpen(false);
  }

  const isEmpty = messages.length === 0 && !typing;

  return (
    <main className="screen chat-screen">
      {/* Slide-in drawer */}
      <div className={"chat-drawer-overlay" + (sideOpen ? " is-open" : "")} onClick={() => setSideOpen(false)} />
      <aside className={"chat-drawer" + (sideOpen ? " is-open" : "")} aria-hidden={!sideOpen}>
        <div className="drawer-head">
          <div className="side-title">Conversas</div>
          <button className="icon-btn" onClick={() => setSideOpen(false)} aria-label="Fechar">✕</button>
        </div>
        <button className="btn btn-primary drawer-new" onClick={newConversation}>
          <span aria-hidden="true">+</span> Nova conversa
        </button>
        <ul className="side-list drawer-list">
          {RECENT_CONVERSATIONS.map((c) => (
            <li key={c.id} className={"side-link" + (c.active ? " is-active" : "")}>
              <span className="side-link-title">{c.title}</span>
              <span className="side-link-when">{c.when}</span>
            </li>
          ))}
        </ul>
        <div className="drawer-footer">
          <div className="side-title">Contexto</div>
          <ul className="side-list">
            {docs.slice(0, 4).map((d) => (
              <li key={d.id} className="side-doc">
                <span className="pill-dot" />
                <span className="side-doc-name" title={d.name}>{d.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="chat-main">
        <div className="chat-head">
          <div className="chat-head-left">
            <button className="icon-btn drawer-toggle" onClick={() => setSideOpen(true)} aria-label="Abrir conversas">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <line x1="3" y1="5" x2="17" y2="5"></line>
                <line x1="3" y1="10" x2="17" y2="10"></line>
                <line x1="3" y1="15" x2="17" y2="15"></line>
              </svg>
            </button>
            <div>
              <div className="chat-title">Conversa com Jarvis</div>
              <div className="chat-sub">{docs.length} documentos no contexto · respostas com referência</div>
            </div>
          </div>
          <div className="chat-head-actions">
            <button className="row-btn" onClick={newConversation}>+ Nova conversa</button>
            <span className="badge-mono">modelo: jarvis-edu-1</span>
          </div>
        </div>

        {isEmpty ? (
          <div className="chat-empty">
            <div className="empty-greeting">
              <span className="greet-word">{greetingForNow()},</span>
              <span className="greet-name">{firstName}.</span>
            </div>
            <p className="empty-sub">Como posso ajudar com seus estudos hoje?</p>
            <div className="empty-suggest">
              {suggestions.map((s) => (
                <button key={s} className="empty-card" onClick={() => send(s)} disabled={typing}>
                  <span className="empty-card-arrow">↗</span>
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-stream" ref={scrollRef}>
            {messages.map((m) => (
              <Message key={m.id} m={m} />
            ))}
            {typing && (
              <div className="msg jarvis">
                <div className="msg-avatar">J</div>
                <div className="msg-body">
                  <div className="typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isEmpty && (
          <div className="chat-suggest">
            {suggestions.map((s) => (
              <button key={s} className="suggest" onClick={() => send(s)} disabled={typing}>{s}</button>
            ))}
          </div>
        )}

        <form className="composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <button type="button" className="composer-attach" aria-label="Anexar">+</button>
          <textarea
            className="composer-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte algo sobre seus documentos, peça um resumo, ou diga ‘me lembre na sexta’…"
            rows={1}
            disabled={typing}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <button type="submit" className="btn btn-primary composer-send" disabled={!input.trim() || typing}>Enviar</button>
        </form>
      </section>
    </main>
  );
}

function Message({ m }) {
  if (m.role === "user") {
    return (
      <div className="msg user">
        <div className="msg-body">
          <p>{m.text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="msg jarvis">
      <div className="msg-avatar">J</div>
      <div className="msg-body">
        {m.text.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
        {m.action && (
          <div className="msg-action">
            <span className="msg-action-dot">✓</span>
            <span>{m.action.label}</span>
            <span className="msg-action-tag">adicionado à sua área</span>
          </div>
        )}
        {m.sources && m.sources.length > 0 && (
          <div className="msg-sources">
            {m.sources.map((s) => <span key={s} className="src-chip">{s}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}
