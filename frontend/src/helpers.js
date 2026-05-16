export function fmtDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function todayISO() {
  const dt = new Date();
  const local = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  return local.toISOString().slice(0, 10);
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}
