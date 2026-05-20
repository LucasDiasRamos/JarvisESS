import { useMemo, useState } from "react";
import { fmtDate, todayISO } from "./helpers";

const EVENT_TYPES = [
  { id: "exam", label: "Prova" },
  { id: "deadline", label: "Entrega" },
  { id: "class", label: "Aula" },
  { id: "event", label: "Evento" },
];

export default function StudentScreen({ tasks, setTasks, events, currentUser, apiBaseUrl, reloadStudentData }) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [picker, setPicker] = useState({
    day: today.getDate(),
    month: today.getMonth(),
    year: today.getFullYear(),
  });
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [taskError, setTaskError] = useState("");
  const [calendarTitle, setCalendarTitle] = useState("");
  const [calendarTime, setCalendarTime] = useState("09:00");
  const [calendarType, setCalendarType] = useState("event");
  const [calendarError, setCalendarError] = useState("");
  const [filter, setFilter] = useState("all");
  const userId = currentUser?.id || currentUser?.usuario_id || 1;

  const grid = useMemo(() => buildMonthGrid(view.y, view.m, events, selectedDate), [view, events, selectedDate]);
  const daysInPickerMonth = new Date(picker.year, picker.month + 1, 0).getDate();
  const pickerDay = Math.min(picker.day, daysInPickerMonth);

  async function toggle(id) {
    const current = tasks.find((task) => task.id === id);
    if (!current || current.done) return;

    const previous = tasks;
    setTasks((t) => t.map((x) => x.id === id ? { ...x, done: true } : x));

    try {
      const response = await fetch(`${apiBaseUrl}/tarefas/${id}/concluir`, { method: "PUT" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await reloadStudentData?.();
    } catch (error) {
      console.warn("Nao foi possivel concluir a tarefa", error);
      setTasks(previous);
    }
  }

  async function addNewTask() {
    if (!newTitle.trim()) return;

    const title = newTitle.trim();
    const due = newDue || null;
    setTaskError("");
    setNewTitle("");
    setNewDue("");

    try {
      const response = await fetch(`${apiBaseUrl}/tarefas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          usuario_id: userId,
          origem: "user",
          titulo: title,
          descricao: "",
          data_limite: due,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await reloadStudentData?.();
    } catch (error) {
      console.warn("Nao foi possivel criar a tarefa", error);
      setTaskError("Nao foi possivel adicionar a tarefa.");
      setNewTitle(title);
      setNewDue(due || "");
    }
  }

  async function addCalendarItem() {
    const title = calendarTitle.trim();
    if (!title) return;

    setCalendarError("");

    try {
      const response = await fetch(`${apiBaseUrl}/lembretes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          usuario_id: userId,
          origem: "user",
          titulo: title,
          descricao: "",
          tipo: calendarType,
          data_hora: `${selectedDate} ${calendarTime || "09:00"}:00`,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setCalendarTitle("");
      await reloadStudentData?.();
    } catch (error) {
      console.warn("Nao foi possivel criar o item do calendario", error);
      setCalendarError("Nao foi possivel adicionar no calendario.");
    }
  }

  async function removeTask(id) {
    const previous = tasks;
    setTasks((all) => all.filter((x) => x.id !== id));

    try {
      const response = await fetch(`${apiBaseUrl}/tarefas/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) throw new Error(`HTTP ${response.status}`);
      await reloadStudentData?.();
    } catch (error) {
      console.warn("Nao foi possivel excluir a tarefa", error);
      setTasks(previous);
    }
  }

  function syncPickerFromView() {
    setPicker({
      day: Number(selectedDate.slice(8, 10)) || today.getDate(),
      month: view.m,
      year: view.y,
    });
    setPickerOpen((open) => !open);
  }

  function goToToday() {
    const now = new Date();
    const iso = todayISO();
    setSelectedDate(iso);
    setView({ y: now.getFullYear(), m: now.getMonth() });
    setPicker({ day: now.getDate(), month: now.getMonth(), year: now.getFullYear() });
    setPickerOpen(false);
  }

  function applyCalendarSelection() {
    const day = String(pickerDay).padStart(2, "0");
    const month = String(picker.month + 1).padStart(2, "0");
    setSelectedDate(`${picker.year}-${month}-${day}`);
    setView({ y: picker.year, m: picker.month });
    setPicker((current) => ({ ...current, day: pickerDay }));
    setPickerOpen(false);
  }

  function selectCalendarDay(cell) {
    const [year, month, day] = cell.iso.split("-").map(Number);
    setSelectedDate(cell.iso);
    setView({ y: year, m: month - 1 });
    setPicker({ day, month: month - 1, year });
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
              <div className="calendar-picker">
                <button className="icon-btn" onClick={syncPickerFromView} aria-expanded={pickerOpen} type="button">Hoje</button>
                {pickerOpen && (
                  <div className="calendar-picker-popover">
                    <div className="picker-grid">
                      <label>
                        <span>Dia</span>
                        <select
                          value={pickerDay}
                          onChange={(e) => setPicker((current) => ({ ...current, day: Number(e.target.value) }))}
                        >
                          {Array.from({ length: daysInPickerMonth }, (_, index) => index + 1).map((day) => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Mês</span>
                        <select
                          value={picker.month}
                          onChange={(e) => setPicker((current) => ({ ...current, month: Number(e.target.value) }))}
                        >
                          {monthOptions().map((month) => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Ano</span>
                        <select
                          value={picker.year}
                          onChange={(e) => setPicker((current) => ({ ...current, year: Number(e.target.value) }))}
                        >
                          {yearOptions(today.getFullYear()).map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="picker-actions">
                      <button className="row-btn" type="button" onClick={goToToday}>Ir para hoje</button>
                      <button className="btn btn-primary" type="button" onClick={applyCalendarSelection}>Aplicar</button>
                    </div>
                  </div>
                )}
              </div>
              <button className="icon-btn" onClick={() => setView(next(view))} aria-label="Próximo mês">›</button>
            </div>
          </div>

          <div className="cal-weekdays">
            {["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="cal-grid">
            {grid.map((cell, i) =>
            <button
              key={i}
              type="button"
              className={"cal-cell" + (cell.outside ? " outside" : "") + (cell.isToday ? " is-today" : "") + (cell.isSelected ? " is-selected" : "")}
              onClick={() => selectCalendarDay(cell)}
              aria-label={`Selecionar ${cell.iso}`}
            >
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
              </button>
            )}
          </div>

          <form className="calendar-new" onSubmit={(e) => { e.preventDefault(); addCalendarItem(); }}>
            <div className="calendar-new-head">
              <div>
                <div className="card-title">Adicionar no calendário</div>
                <div className="card-sub">{fmtDate(selectedDate)}</div>
              </div>
              <div className="event-type-group">
                {EVENT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    className={"event-type-btn evt-" + type.id + (calendarType === type.id ? " is-active" : "")}
                    onClick={() => setCalendarType(type.id)}
                  >
                    <span className={"lg-sq evt-" + type.id}></span>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="calendar-new-fields">
              <input
                className="input"
                placeholder="Titulo do item"
                value={calendarTitle}
                onChange={(e) => setCalendarTitle(e.target.value)}
              />
              <input
                type="time"
                className="input input-date"
                value={calendarTime}
                onChange={(e) => setCalendarTime(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" disabled={!calendarTitle.trim()}>Adicionar</button>
            </div>
            {calendarError && <div className="form-error">{calendarError}</div>}
          </form>

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
          {taskError && <div className="form-error">{taskError}</div>}

          <ul className="todo-list">
            {filtered.map((t) =>
            <li key={t.id} className={"todo-row" + (t.done ? " is-done" : "")}>
                <button className="check" aria-label="Marcar concluída" onClick={() => toggle(t.id)}>
                  {t.done ? <span aria-hidden="true">✓</span> : <span aria-hidden="true"></span>}
                </button>
                <div className="todo-body">
                  <div className="todo-title">{t.title}</div>
                  <div className="todo-meta">
                    {t.due && <span className="mono">{fmtDate(t.due)}</span>}
                    {t.due && <span className="sep">·</span>}
                    <span>{t.tag}</span>
                    {t.source === "jarvis" && <span className="jarvis-tag">criado pelo Jarvis</span>}
                  </div>
                </div>
                <button className="row-btn danger" onClick={() => removeTask(t.id)}>Excluir</button>
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

function monthOptions() {
  return Array.from({ length: 12 }, (_, value) => ({
    value,
    label: new Date(2026, value, 1).toLocaleDateString("pt-BR", { month: "short" }),
  }));
}

function yearOptions(currentYear) {
  return Array.from({ length: 11 }, (_, index) => currentYear - 5 + index);
}

function buildMonthGrid(y, m, events, selectedDate) {
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
      isSelected: iso === selectedDate,
      iso,
      events: events.filter((e) => e.date === iso)
    });
  }
  return cells;
}
