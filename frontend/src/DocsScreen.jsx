import { useRef, useState } from "react";
import { fmtDate, todayISO, uid } from "./helpers";

export default function DocsScreen({ docs, setDocs }) {
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef(null);

  function addFiles(list) {
    const arr = Array.from(list || []);
    if (!arr.length) return;
    const now = todayISO();
    const newOnes = arr.map((f) => ({
      id: uid(),
      name: f.name,
      size: (f.size / 1024 / 1024).toFixed(1) + " MB",
      pages: Math.max(8, Math.round(f.size / 80000)),
      added: now,
      source: "upload",
      url: URL.createObjectURL(f),
    }));
    setDocs((d) => [...newOnes, ...d]);
  }

  function remove(id) {
    setDocs((d) => d.filter((x) => x.id !== id));
  }

  const rawCount = docs.filter((d) => d.source === "raw").length;
  const uploadCount = docs.filter((d) => d.source === "upload").length;

  return (
    <main className="screen docs-screen">
      <header className="page-head">
        <div>
          <div className="eyebrow"><span className="dot" /> base de conhecimento</div>
          <h2 className="page-title">Documentos</h2>
          <p className="page-sub">PDFs de data/raw ficam disponíveis aqui para consulta e abertura rápida em outra aba.</p>
        </div>
        <div className="docs-stats">
          <div className="stat"><div className="stat-n">{docs.length}</div><div className="stat-l">Documentos</div></div>
          <div className="stat"><div className="stat-n">{rawCount}</div><div className="stat-l">Em data/raw</div></div>
          <div className="stat"><div className="stat-n">{uploadCount}</div><div className="stat-l">Enviados</div></div>
        </div>
      </header>

      <section
        className={"dropzone" + (dragOver ? " is-over" : "")}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
      >
        <div className="dz-icon" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="6" y="4" width="20" height="24" rx="2"></rect>
            <path d="M11 14h10M11 18h10M11 22h6"></path>
          </svg>
        </div>
        <div className="dz-title">Arraste PDFs para esta área</div>
        <div className="dz-sub">ou <button className="link" onClick={() => fileInput.current && fileInput.current.click()}>escolha do seu computador</button> · até 200 MB por arquivo</div>
        <input ref={fileInput} type="file" accept="application/pdf" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </section>

      <section className="doc-list">
        <div className="doc-list-head">
          <span>Arquivo</span>
          <span>Páginas</span>
          <span>Adicionado</span>
          <span></span>
        </div>
        {docs.map((d) => (
          <article key={d.id} className="doc-row">
            <div className="doc-name-cell">
              <span className="doc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"></path>
                  <path d="M14 3v5h5"></path>
                </svg>
              </span>
              <div>
                <div className="doc-name">{d.name}</div>
                <div className="doc-meta">{d.size}</div>
              </div>
            </div>
            <div className="doc-cell mono" data-label="Páginas">{d.pages}</div>
            <div className="doc-cell mono" data-label="Adicionado">{fmtDate(d.added)}</div>
            <div className="doc-actions">
              <a className="row-btn" href={d.url} target="_blank" rel="noopener noreferrer">Visualizar</a>
              <button className="row-btn danger" onClick={() => remove(d.id)}>Remover</button>
            </div>
          </article>
        ))}
        {docs.length === 0 && (
          <div className="empty">Nenhum documento. Arraste um PDF para começar.</div>
        )}
      </section>
    </main>
  );
}
