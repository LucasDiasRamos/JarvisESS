import { useEffect, useMemo, useState } from "react";

const LOG_TYPES = [
  { id: "tools", label: "Tool calling" },
  { id: "rag", label: "RAG" },
  { id: "agenda", label: "Agenda" },
  { id: "tarefas", label: "Tarefas" },
  { id: "erros", label: "Erros" },
  { id: "uploads", label: "Uploads" },
];

function formatDate(value) {
  if (!value) return "-";
  return String(value).replace("T", " ");
}

function shortText(value, max = 120) {
  if (value === null || value === undefined) return "-";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (!text) return "-";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function toolSummary(log) {
  return {
    title: log.ferramenta || "tool",
    meta: `user_id: ${log.user_id ?? "-"}`,
    detail: shortText(log.entrada),
    ok: Boolean(log.sucesso),
  };
}

function ragSummary(log) {
  const docs = Array.isArray(log.documentos_recuperados) ? log.documentos_recuperados : [];
  const chunks = Array.isArray(log.chunks_usados) ? log.chunks_usados : [];
  return {
    title: shortText(log.pergunta, 90),
    meta: `${docs.length} doc(s) · ${chunks.length} chunk(s) · score ${log.score_relevancia ?? "-"}`,
    detail: shortText(log.resposta_gerada),
    ok: true,
  };
}

function agendaSummary(log) {
  const eventos = Array.isArray(log.saida) ? log.saida.length : (log.saida ? 1 : 0);
  return {
    title: log.acao || "agenda",
    meta: `${eventos} evento(s)`,
    detail: shortText(log.entrada),
    ok: true,
  };
}

function tarefaSummary(log) {
  return {
    title: log.acao || "tarefa",
    meta: log.status || "-",
    detail: shortText(log.tarefa),
    ok: Boolean(log.sucesso),
  };
}

function erroSummary(log) {
  return {
    title: log.tipo_erro || "erro",
    meta: shortText(log.possivel_causa, 90),
    detail: shortText(log.mensagem),
    ok: false,
  };
}

function uploadSummary(log) {
  return {
    title: log.arquivo || "documento",
    meta: `${log.quantidade_chunks ?? 0} chunk(s) · embedding ${log.embedding_gerado ? "sim" : "nao"}`,
    detail: log.status || "-",
    ok: log.status !== "erro",
  };
}

function getSummary(type, log) {
  if (type === "rag") return ragSummary(log);
  if (type === "agenda") return agendaSummary(log);
  if (type === "tarefas") return tarefaSummary(log);
  if (type === "erros") return erroSummary(log);
  if (type === "uploads") return uploadSummary(log);
  return toolSummary(log);
}

function mainColumnLabel(type) {
  return {
    rag: "pergunta",
    agenda: "acao",
    tarefas: "tarefa",
    erros: "tipo",
    uploads: "arquivo",
    tools: "ferramenta",
  }[type] || "registro";
}

export default function LogsScreen({ apiBaseUrl }) {
  const [type, setType] = useState("tools");
  const [logs, setLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadLogs(selectedType = type) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiBaseUrl}/logs/${selectedType}?limit=200`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.erro || `HTTP ${response.status}`);
      }

      const nextLogs = Array.isArray(data.logs) ? data.logs : [];
      setLogs(nextLogs);
      setSelected(nextLogs[0] || null);
    } catch (loadError) {
      setLogs([]);
      setSelected(null);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs(type);
  }, [type]);

  const summary = useMemo(() => {
    if (type === "uploads") {
      const embeddings = logs.filter((log) => log.embedding_gerado).length;
      return [
        { label: "registros", value: logs.length },
        { label: "chunks", value: logs.reduce((acc, log) => acc + Number(log.quantidade_chunks || 0), 0) },
        { label: "embeddings", value: embeddings },
      ];
    }

    if (type === "erros") {
      return [
        { label: "registros", value: logs.length },
        { label: "tipo", value: "erros" },
        { label: "falhas", value: logs.length },
      ];
    }

    if (type === "agenda") {
      return [
        { label: "registros", value: logs.length },
        { label: "tipo", value: "agenda" },
        { label: "acoes", value: new Set(logs.map((log) => log.acao)).size },
      ];
    }

    if (type === "tarefas") {
      const successCount = logs.filter((log) => log.sucesso).length;
      return [
        { label: "registros", value: logs.length },
        { label: "sucesso", value: successCount },
        { label: "falhas", value: logs.length - successCount },
      ];
    }

    if (type === "rag") {
      const totalChunks = logs.reduce((acc, log) => acc + (log.chunks_usados?.length || 0), 0);
      return [
        { label: "registros", value: logs.length },
        { label: "chunks", value: totalChunks },
        { label: "tipo", value: "rag" },
      ];
    }

    const successCount = logs.filter((log) => log.sucesso).length;
    return [
      { label: "registros", value: logs.length },
      { label: "sucesso", value: successCount },
      { label: "falhas", value: logs.length - successCount },
    ];
  }, [logs, type]);

  return (
    <main className="screen logs-screen">
      <div className="page-head">
        <div>
          <div className="eyebrow"><span className="dot" /> observabilidade</div>
          <h1 className="page-title">Logs da IA</h1>
          <p className="page-sub">Acompanhe chamadas de ferramentas e consultas RAG registradas pelo backend.</p>
        </div>
        <div className="log-actions">
          <div className="filter-group">
            {LOG_TYPES.map((item) => (
              <button
                key={item.id}
                className={"chip-btn" + (type === item.id ? " is-active" : "")}
                onClick={() => setType(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button className="row-btn" onClick={() => loadLogs(type)} disabled={loading}>
            Atualizar
          </button>
        </div>
      </div>

      <section className="logs-stats">
        {summary.map((item) => (
          <div className="stat" key={item.label}>
            <div className="stat-n">{item.value}</div>
            <div className="stat-l">{item.label}</div>
          </div>
        ))}
      </section>

      {error && <div className="log-error">Nao foi possivel carregar os logs: {error}</div>}

      <section className="logs-layout">
        <div className="log-list">
          <div className="log-list-head">
            <span>data_hora</span>
            <span>{mainColumnLabel(type)}</span>
            <span>status</span>
          </div>

          {loading && <div className="empty">Carregando logs...</div>}
          {!loading && logs.length === 0 && <div className="empty">Nenhum log encontrado.</div>}

          {!loading && logs.map((log, index) => {
            const item = getSummary(type, log);
            return (
              <button
                key={`${log.data_hora || "sem-data"}-${index}`}
                className={"log-row" + (selected === log ? " is-active" : "")}
                onClick={() => setSelected(log)}
              >
                <span className="log-date">{formatDate(log.data_hora)}</span>
                <span className="log-main">
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                  <small>{item.detail}</small>
                </span>
                <span className={"log-status" + (item.ok ? " is-ok" : " is-error")}>
                  {item.ok ? "sucesso" : "falha"}
                </span>
              </button>
            );
          })}
        </div>

        <aside className="log-detail">
          <div className="card-head">
            <div>
              <div className="card-title">Detalhe</div>
              <div className="card-sub">{selected ? formatDate(selected.data_hora) : "sem registro selecionado"}</div>
            </div>
          </div>
          <pre>{selected ? JSON.stringify(selected, null, 2) : "Selecione um registro."}</pre>
        </aside>
      </section>
    </main>
  );
}
