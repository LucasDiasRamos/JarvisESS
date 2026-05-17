import { useEffect, useRef, useState } from "react";
import { fmtDate, uid } from "./helpers";

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

export default function ChatScreen({ docs, addTask, addEvent, currentUser }) {
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

  function respondTo(text) {
    const t = text.toLowerCase();
    if (t.includes("lembre") || t.includes("lembrete") || t.includes("agend")) {
      const dueMatch = t.match(/(seg|ter|qua|qui|sex|sáb|sab|dom)/);
      const dueMap = {
        seg: "2026-05-18", ter: "2026-05-19", qua: "2026-05-20",
        qui: "2026-05-21", sex: "2026-05-22", sab: "2026-05-23", "sáb": "2026-05-23", dom: "2026-05-24",
      };
      const due = (dueMatch && dueMap[dueMatch[1]]) || "2026-05-16";
      const title = text.replace(/.*lembr\w+\s*(de|para)?\s*/i, "").trim() || "Revisão de estudos";
      const cleanTitle = title.charAt(0).toUpperCase() + title.slice(1);
      addEvent({ id: uid(), date: due, title: cleanTitle, kind: "deadline", source: "jarvis" });
      addTask({ id: uid(), title: cleanTitle, due, done: false, source: "jarvis", tag: "Pelo Jarvis" });
      return {
        text: `Lembrete criado para ${fmtDate(due)}. Também adicionei como tarefa na sua área. Quer que eu mande uma notificação 1 dia antes?`,
        action: { kind: "created", label: `${fmtDate(due)} · ${cleanTitle}` },
      };
    }
    if (t.includes("resuma") || t.includes("resumo") || t.includes("cormen") || t.includes("capítulo")) {
      return {
        text: "Resumo do capítulo 3 do Cormen — notação assintótica:\n\n1. Define O, Ω e Θ como ferramentas para descrever o comportamento de funções de custo.\n2. Mostra que essas notações ignoram constantes e termos de menor ordem.\n3. Apresenta exemplos com 2n² + 3n e demonstrações formais por limite.\n\nPosso converter em 10 cards de revisão?",
        sources: ["Algoritmos_Cormen_cap03.pdf · p.43–58"],
      };
    }
    if (t.includes("derivada") || t.includes("cálculo") || t.includes("calculo")) {
      return {
        text: "Da aula 07 de Cálculo I (derivadas): regras de soma e produto, derivada do quociente, regra da cadeia e exemplos com funções compostas. Existem 12 exercícios marcados no PDF — quer que eu monte uma lista priorizada para a prova de 15/05?",
        sources: ["Calculo_I_aula_07_derivadas.pdf · p.4–11"],
      };
    }
    if (t.includes("micro") || t.includes("economia") || t.includes("varian")) {
      return {
        text: "Tópico ainda em processamento — Microeconomia_Varian_cap05 está indexando (≈70%). Posso te avisar quando terminar e já gerar as 5 questões.",
        sources: ["Microeconomia_Varian_cap05.pdf"],
      };
    }
    if (t.includes("tarefa") || t.includes("todo") || t.includes("to-do") || t.includes("to do")) {
      const title = "Estudar " + (text.split(/tarefa|todo/i).pop() || "tópico").trim() || "Estudar tópico";
      addTask({ id: uid(), title, due: "2026-05-20", done: false, source: "jarvis", tag: "Pelo Jarvis" });
      return { text: `Tarefa criada na sua área: “${title}”. Estimei 20/05 como prazo — quer mudar?`, action: { kind: "created", label: title } };
    }
    return {
      text:
        "Posso ajudar com isso. Quer que eu busque nas referências indexadas (4 PDFs) ou que eu trate isso como uma anotação para mais tarde?",
    };
  }

  function send(value) {
    const text = (value ?? input).trim();
    if (!text) return;
    const userMsg = { id: uid(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = respondTo(text);
      setMessages((m) => [...m, { id: uid(), role: "jarvis", ...reply }]);
      setTyping(false);
    }, 700);
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
                <button key={s} className="empty-card" onClick={() => send(s)}>
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
              <button key={s} className="suggest" onClick={() => send(s)}>{s}</button>
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
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <button type="submit" className="btn btn-primary composer-send" disabled={!input.trim()}>Enviar</button>
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
