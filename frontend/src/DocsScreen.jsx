import { useRef, useState } from "react";
import { fmtDate } from "./helpers";

function formatSize(bytes) {
  if (!bytes) return "0 MB";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocsScreen({ docs, setDocs, currentUser, apiBaseUrl, reloadDocs }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInput = useRef(null);

  async function addFiles(list) {
    const arr = Array.from(list || []);
    if (!arr.length) return;

    setUploading(true);
    setUploadError("");

    try {
      for (const file of arr) {
        const formData = new FormData();
        formData.append("arquivo", file);

        const params = currentUser?.id ? `?usuario_id=${currentUser.id}` : "";
        const response = await fetch(`${apiBaseUrl}/arquivos/upload${params}`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.erro || `Falha ao enviar ${file.name}`);
        }

        const arquivo = await response.json();
        setDocs((current) => [arquivo, ...current.filter((doc) => doc.id !== arquivo.id)]);
      }

      if (reloadDocs) await reloadDocs();
    } catch (error) {
      setUploadError(error.message || "Nao foi possivel enviar o arquivo.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const uploadCount = docs.filter((d) => d.source === "upload").length;

  return (
    <main className="screen docs-screen">
      <header className="page-head">
        <div>
          <div className="eyebrow"><span className="dot" /> base de conhecimento</div>
          <h2 className="page-title">Documentos</h2>
          <p className="page-sub">PDFs disponíveis para consulta pelo Jarvis e abertura rápida em outra aba.</p>
        </div>
        <div className="docs-stats">
          <div className="stat"><div className="stat-n">{docs.length}</div><div className="stat-l">Documentos</div></div>
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
        <div className="dz-title">{uploading ? "Enviando e convertendo..." : "Arraste PDFs para esta área"}</div>
        <div className="dz-sub">ou <button className="link" onClick={() => fileInput.current && fileInput.current.click()} disabled={uploading}>escolha do seu computador</button> · até 200 MB por arquivo</div>
        <input ref={fileInput} type="file" accept="application/pdf" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        {uploadError && <div className="empty">{uploadError}</div>}
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
              <div className="doc-text">
                <div className="doc-name" title={d.name}>{d.name}</div>
                <div className="doc-meta">{d.size || formatSize(d.sizeBytes || d.tamanho_bytes)} · {d.status_processamento || "pendente"}</div>
              </div>
            </div>
            <div className="doc-cell mono" data-label="Páginas">{d.pages || d.paginas || "-"}</div>
            <div className="doc-cell mono" data-label="Adicionado">{fmtDate(d.added)}</div>
            <div className="doc-actions">
              <a className="row-btn" href={d.url} target="_blank" rel="noopener noreferrer">Visualizar</a>
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
