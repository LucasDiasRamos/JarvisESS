import { useEffect, useState } from "react";
import ChatScreen from "./ChatScreen";
import DocsScreen from "./DocsScreen";
import StudentScreen from "./StudentScreen";
import { seedDocs, seedEvents, seedTasks } from "./data";

const STORAGE_KEY = "jarvis-edu-state-vite";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function initialsFromUser(user) {
  const name = user?.nome || user?.name || "";
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "AL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function TopNav({ screen, setScreen, currentUser }) {
  const items = [
    { id: "landing", label: "Inicio" },
    { id: "chat", label: "Chat" },
    { id: "docs", label: "Documentos" },
    { id: "student", label: "Area do aluno" },
  ];

  return (
    <header className="topnav">
      <button className="brand" onClick={() => setScreen("landing")} aria-label="Jarvis - inicio">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="12" cy="12" r="9.2" />
            <circle cx="12" cy="12" r="3.2" />
            <line x1="12" y1="2.8" x2="12" y2="6.4" />
            <line x1="12" y1="17.6" x2="12" y2="21.2" />
            <line x1="2.8" y1="12" x2="6.4" y2="12" />
            <line x1="17.6" y1="12" x2="21.2" y2="12" />
          </svg>
        </span>
        <span className="brand-name">Jarvis</span>
      </button>
      <nav className="nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={"nav-item" + (screen === item.id ? " is-active" : "")}
            onClick={() => setScreen(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="nav-right">
        <span className="badge-mono">v1.0 beta</span>
        <button className="avatar" aria-label={currentUser?.nome ? `Conta de ${currentUser.nome}` : "Conta"}>
          {initialsFromUser(currentUser)}
        </button>
      </div>
    </header>
  );
}

function Landing({ setScreen }) {
  return (
    <main className="screen landing">
      <section className="hero">
        <div className="eyebrow">
          <span className="dot" /> sistema educacional em operacao
        </div>
        <h1 className="hero-title">
          O assistente academico que <em>le</em>, <em>organiza</em> e <em>lembra</em> por voce.
        </h1>
        <p className="hero-sub">
          Jarvis transforma seus PDFs em conhecimento conversavel, cria lembretes
          a partir das suas conversas e mantem seus estudos em ordem.
        </p>
        <div className="hero-cta">
          <button className="btn btn-primary" onClick={() => setScreen("chat")}>Comecar agora</button>
          <button className="btn btn-ghost" onClick={() => setScreen("docs")}>Ver documentos</button>
        </div>
        <div className="hero-meta">
          <span>PDFs em data/raw</span>
          <span className="sep">.</span>
          <span>Estado local</span>
          <span className="sep">.</span>
          <span>Calendario e tarefas</span>
        </div>
      </section>

      <section className="terminal-card">
        <div className="terminal-head">
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="term-title">jarvis - conversa</span>
        </div>
        <div className="terminal-body">
          <div className="t-line"><span className="t-prompt">aluno ›</span> resuma um artigo da base</div>
          <div className="t-line t-reply">
            <span className="t-prompt jarvis">jarvis »</span>
            Posso consultar os PDFs cadastrados, responder com referencias e criar tarefas a partir da conversa.
          </div>
          <div className="t-line"><span className="t-prompt">aluno ›</span> me lembre de revisar sexta</div>
          <div className="t-line t-reply">
            <span className="t-prompt jarvis">jarvis »</span>
            Lembrete criado: <span className="chip">sexta - Revisao</span>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article className="feature">
          <div className="feature-num">01</div>
          <h3>Converse com seus PDFs</h3>
          <p>Use os materiais cadastrados para simular respostas com base em documentos.</p>
        </article>
        <article className="feature">
          <div className="feature-num">02</div>
          <h3>Organizacao integrada</h3>
          <p>Tarefas e eventos criados no chat aparecem na area do aluno.</p>
        </article>
        <article className="feature">
          <div className="feature-num">03</div>
          <h3>Base local</h3>
          <p>Os PDFs da pasta data/raw aparecem na tela de documentos e abrem em nova aba.</p>
        </article>
      </section>
    </main>
  );
}

function loadState() {
  const fallback = {
    docs: [...seedDocs],
    tasks: [...seedTasks],
    events: [...seedEvents],
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      docs: Array.isArray(parsed.docs) ? parsed.docs : fallback.docs,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : fallback.tasks,
      events: Array.isArray(parsed.events) ? parsed.events : fallback.events,
    };
  } catch (error) {
    console.warn("Jarvis state was reset", error);
    return fallback;
  }
}

function screenLabel(screen) {
  return ({ landing: "01 Landing", chat: "02 Chat", docs: "03 Documents", student: "04 Student Area" })[screen] || screen;
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const initial = loadState();
  const [docs, setDocs] = useState(initial.docs);
  const [tasks, setTasks] = useState(initial.tasks);
  const [events, setEvents] = useState(initial.events);
  const [currentUser, setCurrentUser] = useState(null);

  async function loadDocsFromDatabase() {
    try {
      const response = await fetch(`${API_BASE_URL}/arquivos`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const arquivos = await response.json();
      if (Array.isArray(arquivos)) {
        setDocs(arquivos);
      }
    } catch (error) {
      console.warn("Nao foi possivel carregar os documentos do banco", error);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadCurrentUser() {
      try {
        const response = await fetch(`${API_BASE_URL}/usuarios`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const users = await response.json();
        if (!ignore && Array.isArray(users) && users.length > 0) {
          setCurrentUser(users[0]);
        }
      } catch (error) {
        console.warn("Nao foi possivel carregar o usuario atual", error);
      }
    }

    loadCurrentUser();
    loadDocsFromDatabase();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ docs, tasks, events }));
  }, [docs, tasks, events]);

  const addTask = (task) => setTasks((all) => [task, ...all]);
  const addEvent = (event) => setEvents((all) => [event, ...all]);

  return (
    <div data-screen-label={screenLabel(screen)}>
      <TopNav screen={screen} setScreen={setScreen} currentUser={currentUser} />
      {screen === "landing" && <Landing setScreen={setScreen} />}
      {screen === "chat" && (
        <ChatScreen
          docs={docs}
          addTask={addTask}
          addEvent={addEvent}
          currentUser={currentUser}
          apiBaseUrl={API_BASE_URL}
        />
      )}
      {screen === "docs" && (
        <DocsScreen
          docs={docs}
          setDocs={setDocs}
          currentUser={currentUser}
          apiBaseUrl={API_BASE_URL}
          reloadDocs={loadDocsFromDatabase}
        />
      )}
      {screen === "student" && <StudentScreen tasks={tasks} setTasks={setTasks} events={events} />}
    </div>
  );
}
