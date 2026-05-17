import json
import sys
from pathlib import Path

import fitz
import pymupdf4llm

BASE_DIR = Path(__file__).parent.parent

RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
PROCESSED_DIR.mkdir(exist_ok=True)

def convert_one(pdf_path, md_path=None):
    pdf_path = Path(pdf_path)
    md_path = Path(md_path) if md_path else PROCESSED_DIR / (pdf_path.stem + ".md")

    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF nao encontrado: {pdf_path}")

    md_path.parent.mkdir(parents=True, exist_ok=True)

    with fitz.open(pdf_path) as doc:
        pages = doc.page_count

    md_text = pymupdf4llm.to_markdown(str(pdf_path))
    md_path.write_text(md_text, encoding="utf-8")

    return {"pages": pages, "md_path": str(md_path)}

def convert_all():
    pdfs = list(RAW_DIR.glob("*.pdf"))
    print(f"Encontrados {len(pdfs)} PDFs")
    
    for pdf_path in pdfs:
        md_path = PROCESSED_DIR / (pdf_path.stem + ".md")
        
        if md_path.exists():
            print(f" [SKIP] {pdf_path.name} já convertido")
            continue
        
        print(f" [CONV] {pdf_path.name} → {md_path.name}")
        convert_one(pdf_path, md_path)

def main():
    if len(sys.argv) == 1:
        convert_all()
        return 0

    if len(sys.argv) == 3:
        result = convert_one(sys.argv[1], sys.argv[2])
        print(json.dumps(result))
        return 0

    print("Uso: convert_pdfs.py [<pdf_path> <md_path>]", file=sys.stderr)
    return 2
        
if __name__ == "__main__":
    raise SystemExit(main())
