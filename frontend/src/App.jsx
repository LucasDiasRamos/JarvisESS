import { useEffect, useState } from "react";
import ChatScreen from "./ChatScreen";
import DocsScreen from "./DocsScreen";
import LogsScreen from "./LogsScreen";
import StudentScreen from "./StudentScreen";
import { seedDocs } from "./data";

const STORAGE_KEY = "jarvis-edu-state-vite-db";
const CURRENT_USER_KEY = "jarvis-current-user-id";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function initialsFromUser(user) {
  const name = user?.nome || user?.name || "";
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "AL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function TopNav({ screen, setScreen, currentUser, onCreateUser }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountError, setAccountError] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const items = [
    { id: "chat", label: "Chat" },
    { id: "docs", label: "Documentos" },
    { id: "student", label: "Area do aluno" },
    { id: "logs", label: "Logs" },
  ];
  const isChat = screen === "chat";

  function handleBrandClick() {
    if (isChat) {
      window.dispatchEvent(new CustomEvent("jarvis:open-chat-drawer"));
      return;
    }

    setScreen("chat");
  }

  async function handleCreateAccount(event) {
    event.preventDefault();

    const nome = accountName.trim();
    const email = accountEmail.trim();

    if (!nome) {
      setAccountError("Informe um nome.");
      return;
    }

    setCreatingAccount(true);
    setAccountError("");

    try {
      await onCreateUser({ nome, email: email || null });
      setAccountName("");
      setAccountEmail("");
      setShowCreateAccount(false);
      setAccountOpen(false);
    } catch (error) {
      setAccountError(error.message || "Nao foi possivel criar a conta.");
    } finally {
      setCreatingAccount(false);
    }
  }

  return (
    <header className="topnav">
      <button
        className={"brand" + (isChat ? " chat-menu-brand" : "")}
        onClick={handleBrandClick}
        aria-label={isChat ? "Abrir conversas" : "Ir para o chat"}
      >
        <span className="brand-mark" aria-hidden="true">
          <svg className="brand-orbit" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="12" cy="12" r="9.2" />
            <circle cx="12" cy="12" r="3.2" />
            <line x1="12" y1="2.8" x2="12" y2="6.4" />
            <line x1="12" y1="17.6" x2="12" y2="21.2" />
            <line x1="2.8" y1="12" x2="6.4" y2="12" />
            <line x1="17.6" y1="12" x2="21.2" y2="12" />
          </svg>
          <svg className="brand-menu" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="4.5" y1="7" x2="19.5" y2="7" />
            <line x1="4.5" y1="12" x2="19.5" y2="12" />
            <line x1="4.5" y1="17" x2="19.5" y2="17" />
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
        <div className="account-menu">
          <button
            className="avatar"
            aria-label={currentUser?.nome ? `Conta de ${currentUser.nome}` : "Conta"}
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((open) => !open)}
          >
            {initialsFromUser(currentUser)}
          </button>
          {accountOpen && (
            <div className="account-popover">
              <div className="account-current">
                <span className="account-label">Conta atual</span>
                <strong>{currentUser?.nome || "Aluno"}</strong>
                {currentUser?.email && <span>{currentUser.email}</span>}
              </div>
              {!showCreateAccount ? (
                <button className="btn btn-ghost full" onClick={() => setShowCreateAccount(true)}>
                  Criar conta
                </button>
              ) : (
                <form className="account-form" onSubmit={handleCreateAccount}>
                  <input
                    value={accountName}
                    onChange={(event) => setAccountName(event.target.value)}
                    placeholder="Nome"
                    aria-label="Nome"
                    disabled={creatingAccount}
                  />
                  <input
                    value={accountEmail}
                    onChange={(event) => setAccountEmail(event.target.value)}
                    placeholder="Email opcional"
                    aria-label="Email opcional"
                    type="email"
                    disabled={creatingAccount}
                  />
                  {accountError && <span className="account-error">{accountError}</span>}
                  <div className="account-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setShowCreateAccount(false);
                        setAccountError("");
                      }}
                      disabled={creatingAccount}
                    >
                      Cancelar
                    </button>
                    <button className="btn btn-primary" disabled={creatingAccount}>
                      {creatingAccount ? "Criando..." : "Criar"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function loadState() {
  const fallback = {
    docs: [...seedDocs],
    tasks: [],
    events: [],
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
  return ({ chat: "01 Chat", docs: "02 Documents", student: "03 Student Area", logs: "04 Logs" })[screen] || screen;
}

export default function App() {
  const [screen, setScreen] = useState("chat");
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

  async function loadCurrentUserFromDatabase() {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const users = await response.json();
      if (Array.isArray(users) && users.length > 0) {
        const selectedId = Number(localStorage.getItem(CURRENT_USER_KEY));
        const selectedUser = users.find((user) => Number(user.id) === selectedId) || users[0];
        setCurrentUser(selectedUser);
        return selectedUser;
      }

      setCurrentUser(null);
      return null;
    } catch (error) {
      console.warn("Nao foi possivel carregar o usuario atual", error);
      setCurrentUser(null);
      return null;
    }
  }

  function mapTask(row) {
    return {
      id: row.id,
      title: row.titulo,
      due: row.data_limite || "",
      done: Boolean(row.concluida),
      source: row.origem || row.source || "user",
      tag: row.descricao || "Tarefa",
    };
  }

  function mapReminder(row) {
    return {
      id: row.id,
      date: String(row.data_hora || "").slice(0, 10),
      title: row.titulo,
      kind: row.tipo || row.kind || "event",
      source: row.origem || row.source || "user",
      descricao: row.descricao || "",
    };
  }

  async function loadStudentData(user = currentUser) {
    const userId = user?.id || user?.usuario_id;
    if (!userId) {
      setTasks([]);
      setEvents([]);
      return;
    }

    try {
      const [tasksResponse, remindersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/tarefas/${userId}`),
        fetch(`${API_BASE_URL}/lembretes/${userId}`),
      ]);

      if (!tasksResponse.ok) throw new Error(`tarefas HTTP ${tasksResponse.status}`);
      if (!remindersResponse.ok) throw new Error(`lembretes HTTP ${remindersResponse.status}`);

      const [taskRows, reminderRows] = await Promise.all([
        tasksResponse.json(),
        remindersResponse.json(),
      ]);

      setTasks(Array.isArray(taskRows) ? taskRows.map(mapTask) : []);
      setEvents(Array.isArray(reminderRows) ? reminderRows.map(mapReminder) : []);
    } catch (error) {
      console.warn("Nao foi possivel carregar area do aluno", error);
      setTasks([]);
      setEvents([]);
    }
  }

  async function createUser({ nome, email }) {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, tipo: "aluno" }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.erro || `HTTP ${response.status}`);
    }

    localStorage.setItem(CURRENT_USER_KEY, String(payload.id));
    setCurrentUser(payload);
    await loadStudentData(payload);
    return payload;
  }

  useEffect(() => {
    let ignore = false;

    async function loadCurrentUser() {
      const user = await loadCurrentUserFromDatabase();
      if (ignore) return;

      if (user) {
        await loadStudentData(user);
      } else {
        setTasks([]);
        setEvents([]);
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

  useEffect(() => {
    let ignore = false;

    async function refreshActiveScreen() {
      const user = currentUser || await loadCurrentUserFromDatabase();
      if (ignore) return;

      if (screen === "docs") {
        await loadDocsFromDatabase();
      }

      if (screen === "student") {
        await loadStudentData(user);
      }
    }

    refreshActiveScreen();
    return () => {
      ignore = true;
    };
  }, [screen]);

  const addTask = (task) => setTasks((all) => [task, ...all]);
  const addEvent = (event) => setEvents((all) => [event, ...all]);

  return (
    <div data-screen-label={screenLabel(screen)}>
      <TopNav
        screen={screen}
        setScreen={setScreen}
        currentUser={currentUser}
        onCreateUser={createUser}
      />
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
      {screen === "student" && (
        <StudentScreen
          tasks={tasks}
          setTasks={setTasks}
          events={events}
          currentUser={currentUser}
          apiBaseUrl={API_BASE_URL}
          reloadStudentData={loadStudentData}
        />
      )}
      {screen === "logs" && <LogsScreen apiBaseUrl={API_BASE_URL} />}
    </div>
  );
}
