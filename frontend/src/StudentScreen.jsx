import { useMemo, useState } from "react";
import { fmtDate, todayISO, uid } from "./helpers";

export default function StudentScreen({ tasks, setTasks, events }) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [filter, setFilter] = useState("all");

  const grid = useMemo(() => buildMonthGrid(view.y, view.m, events), [view, events]);

  function toggle(id) {
    setTasks((t) => t.map((x) => x.id === id ? { ...x, done: !x.done } : x));
  }
  function addNewTask() {
    if (!newTitle.trim()) return;
    setTasks((t) => [
    { id: uid(), title: newTitle.trim(), due: newDue || "2026-05-20", done: false, source: "you", tag: "Pessoal" },
    ...t]
    );
    setNewTitle("");setNewDue("");
  }

  const filtered = tasks.filter((t) => filter === "all" ? true : filter === "open" ? !t.done : t.done);
  const openCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <main className="screen student-screen">
      <header className="page-head">
        <div>
          <div className="eyebrow"><span className="dot" /> área do aluno</div>
          <h2 className="page-title">Seu semestre</h2>
          <p className="page-sub">Calendário e tarefas. Itens criados pelo Jarvis aparecem marcados — você decide o que mantém.</p>
        </div>
        <div className="student-stats">
          <div className="stat"><div className="stat-n">{openCount}</div><div className="stat-l">Tarefas abertas</div></div>
          <div className="stat"><div className="stat-n">{doneCount}</div><div className="stat-l">Concluídas</div></div>
          <div className="stat"><div className="stat-n">{events.length}</div><div className="stat-l">No calendário</div></div>
        </div>
      </header>

      <div className="student-grid">
        {/* Calendar */}
        <section className="card calendar-card">
          <div className="card-head">
            <div>
              <div className="card-title">Calendário</div>
              <div className="card-sub">{monthLabel(view.y, view.m)}</div>
            </div>
            <div className="cal-nav">
              <button className="icon-btn" onClick={() => setView(prev(view))} aria-label="Mês anterior">‹</button>
              <button className="icon-btn" onClick={() => setView({ y: today.getFullYear(), m: today.getMonth() })}>Hoje</button>
              <button className="icon-btn" onClick={() => setView(next(view))} aria-label="Próximo mês">›</button>
            </div>
          </div>

          <div className="cal-weekdays">
            {["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="cal-grid">
            {grid.map((cell, i) =>
            <div key={i} className={"cal-cell" + (cell.outside ? " outside" : "") + (cell.isToday ? " is-today" : "")}>
                <span className="cal-day">{cell.day}</span>
                <div className="cal-events">
                  {cell.events.slice(0, 2).map((e) =>
                <span key={e.id} className={"cal-evt evt-" + e.kind} title={e.title}>
                      {e.source === "jarvis" && <span className="cal-evt-mark">J</span>}
                      {e.title}
                    </span>
                )}
                  {cell.events.length > 2 && <span className="cal-more">+{cell.events.length - 2}</span>}
                </div>
              </div>
            )}
          </div>

          <div className="cal-legend">
            <span className="legend-item"><span className="lg-sq evt-exam"></span> Prova</span>
            <span className="legend-item"><span className="lg-sq evt-deadline"></span> Entrega</span>
            <span className="legend-item"><span className="lg-sq evt-class"></span> Aula</span>
            <span className="legend-item"><span className="lg-sq evt-event"></span> Evento</span>
            <span className="legend-item legend-spacer"><span className="lg-mark">J</span> criado pelo Jarvis</span>
          </div>
        </section>

        {/* Todo */}
        <section className="card todo-card">
          <div className="card-head">
            <div>
              <div className="card-title">Tarefas</div>
              <div className="card-sub">Marque como concluída ao terminar.</div>
            </div>
            <div className="filter-group">
              {["all", "open", "done"].map((f) =>
              <button key={f} className={"chip-btn" + (filter === f ? " is-active" : "")} onClick={() => setFilter(f)}>
                  {f === "all" ? "Todas" : f === "open" ? "Abertas" : "Concluídas"}
                </button>
              )}
            </div>
          </div>

          <form className="new-task" onSubmit={(e) => {e.preventDefault();addNewTask();}}>
            <input
              className="input"
              placeholder="Nova tarefa — ex.: revisar lista de Cálculo"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)} />
            
            <input
              type="date"
              className="input input-date"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)} />
            
            <button className="btn btn-primary" type="submit">Adicionar</button>
          </form>

          <ul className="todo-list">
            {filtered.map((t) =>
            <li key={t.id} className={"todo-row" + (t.done ? " is-done" : "")}>
                <button className="check" aria-label="Marcar concluída" onClick={() => toggle(t.id)}>
                  {t.done ? <span aria-hidden="true">✓</span> : <span aria-hidden="true"></span>}
                </button>
                <div className="todo-body">
                  <div className="todo-title">{t.title}</div>
                  <div className="todo-meta">
                    <span className="mono">{fmtDate(t.due)}</span>
                    <span className="sep">·</span>
                    <span>{t.tag}</span>
                    {t.source === "jarvis" && <span className="jarvis-tag">criado pelo Jarvis</span>}
                  </div>
                </div>
                <button className="row-btn danger" onClick={() => setTasks((all) => all.filter((x) => x.id !== t.id))}>Excluir</button>
              </li>
            )}
            {filtered.length === 0 && <li className="empty">Nada por aqui ainda.</li>}
          </ul>
        </section>
      </div>
    </main>);

}

function monthLabel(y, m) {
  return new Date(y, m, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
function prev(v) {const m = v.m - 1;if (m < 0) return { y: v.y - 1, m: 11 };return { y: v.y, m };}
function next(v) {const m = v.m + 1;if (m > 11) return { y: v.y + 1, m: 0 };return { y: v.y, m };}

function buildMonthGrid(y, m, events) {
  const first = new Date(y, m, 1);
  // make week start on Monday
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(y, m, 1 - offset);
  const todayStr = todayISO();
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    cells.push({
      day: d.getDate(),
      outside: d.getMonth() !== m,
      isToday: iso === todayStr,
      events: events.filter((e) => e.date === iso)
    });
  }
  return cells;
}
