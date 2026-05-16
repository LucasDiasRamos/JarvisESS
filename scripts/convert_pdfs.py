import pymupdf4llm
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent

RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
PROCESSED_DIR.mkdir(exist_ok=True)

def convert_all():
    pdfs = list(RAW_DIR.glob("*.pdf"))
    print(f"Encontados {len(pdfs)} PDFs")
    
    for pdf_path in pdfs:
        md_path = PROCESSED_DIR / (pdf_path.stem + ".md")
        
        if md_path.exists():
            print(f" [SKIP] {pdf_path.name} já convertido")
            continue
        
        print(f" [CONV] {pdf_path.name} → {md_path.name}")
        md_text = pymupdf4llm.to_markdown(str(pdf_path))
        md_path.write_text(md_text, encoding="utf-8")
        
if __name__ == "__main__":
    convert_all()