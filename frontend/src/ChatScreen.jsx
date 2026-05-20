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

export default function ChatScreen({ docs, currentUser, apiBaseUrl }) {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const scrollRef = useRef(null);
  const firstName = firstNameFromUser(currentUser);
  const userId = currentUser?.id || currentUser?.usuario_id || 1;

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

  useEffect(() => {
    const openDrawer = () => setSideOpen(true);
    window.addEventListener("jarvis:open-chat-drawer", openDrawer);
    return () => window.removeEventListener("jarvis:open-chat-drawer", openDrawer);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [userId]);

  function mapStoredMessage(row) {
    return {
      id: row.id || uid(),
      role: row.remetente === "jarvis" ? "jarvis" : "user",
      text: row.conteudo || "",
    };
  }

  function formatConversationDate(value) {
    if (!value) return "";
    const date = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }

  function titleFromMessage(text) {
    const clean = text.trim().replace(/\s+/g, " ");
    if (!clean) return "Nova conversa";
    return clean.length > 48 ? `${clean.slice(0, 48)}...` : clean;
  }

  async function loadConversations() {
    try {
      const response = await fetch(`${apiBaseUrl}/conversas/user/${userId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rows = await response.json();
      setConversations(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.warn("Nao foi possivel carregar conversas", error);
      setConversations([]);
    }
  }

  async function loadConversation(conversationId) {
    try {
      const response = await fetch(`${apiBaseUrl}/mensagens/${conversationId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rows = await response.json();
      setMessages(Array.isArray(rows) ? rows.map(mapStoredMessage) : []);
      setActiveConversationId(conversationId);
      setSideOpen(false);
    } catch (error) {
      console.warn("Nao foi possivel carregar mensagens", error);
    }
  }

  async function createConversation(firstMessage) {
    const response = await fetch(`${apiBaseUrl}/conversas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        usuario_id: userId,
        titulo: titleFromMessage(firstMessage),
      }),
    });

    if (!response.ok) throw new Error(`conversas HTTP ${response.status}`);
    const conversation = await response.json();
    setActiveConversationId(conversation.id);
    await loadConversations();
    return conversation.id;
  }

  async function saveMessage(conversationId, role, text) {
    const response = await fetch(`${apiBaseUrl}/mensagens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversa_id: conversationId,
        remetente: role === "jarvis" ? "jarvis" : "usuario",
        conteudo: text,
      }),
    });

    if (!response.ok) throw new Error(`mensagens HTTP ${response.status}`);
    return response.json();
  }

  function animateJarvisMessage(text) {
    const messageId = uid();
    const step = Math.max(1, Math.ceil(text.length / 90));
    let index = 0;

    setMessages((m) => [...m, { id: messageId, role: "jarvis", text: "", streaming: true }]);

    return new Promise((resolve) => {
      const timer = window.setInterval(() => {
        index = Math.min(text.length, index + step);
        const nextText = text.slice(0, index);

        setMessages((m) => m.map((item) => (
          item.id === messageId
            ? { ...item, text: nextText, streaming: index < text.length }
            : item
        )));

        if (index >= text.length) {
          window.clearInterval(timer);
          resolve();
        }
      }, 18);
    });
  }

  async function send(value) {
    const text = (value ?? input).trim();
    if (!text || typing) return;

    const userMsg = { id: uid(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const conversationId = activeConversationId || await createConversation(text);
      await saveMessage(conversationId, "user", text);

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
      setTyping(false);
      await animateJarvisMessage(replyText);
      await saveMessage(conversationId, "jarvis", replyText);
      await loadConversations();
    } catch (error) {
      const errorText = `Não consegui falar com o Jarvis agora. ${error.message}`;
      setTyping(false);
      await animateJarvisMessage(errorText);
    } finally {
      setTyping(false);
    }
  }

  function newConversation() {
    setMessages([]);
    setActiveConversationId(null);
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
          {activeConversationId === null && (
            <li className="side-link is-active">
              <span className="side-link-title">Sessão atual</span>
              <span className="side-link-when">agora</span>
            </li>
          )}
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                className={"side-link side-link-button" + (activeConversationId === conversation.id ? " is-active" : "")}
                onClick={() => loadConversation(conversation.id)}
              >
                <span className="side-link-title">{conversation.titulo || "Conversa sem titulo"}</span>
                <span className="side-link-when">{formatConversationDate(conversation.criado_em)}</span>
              </button>
            </li>
          ))}
          {conversations.length === 0 && activeConversationId !== null && (
            <li className="empty drawer-empty">Nenhuma conversa salva.</li>
          )}
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
        {isEmpty ? (
          <div className="chat-empty">
            <div className="empty-greeting">
              <span className="greet-word">{greetingForNow()},</span>
              <span className="greet-name">{firstName}.</span>
            </div>
            <p className="empty-sub">Como posso ajudar com seus estudos hoje?</p>
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
        {m.streaming && <span className="stream-cursor" aria-hidden="true"></span>}
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
