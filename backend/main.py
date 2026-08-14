from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
import io

from ai import study_chain


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "StudyVerse backend is running!"}


@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    pdf_bytes = await file.read()

    reader = PdfReader(io.BytesIO(pdf_bytes))

    text = ""

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"
    MAX_CHARS = 50000
    text = text[:MAX_CHARS]
    result = study_chain.invoke({
    "content": text
})

    return {
        "filename": file.filename,
        "pages": len(reader.pages),
        "notes": result["notes"].model_dump(),
        "quiz": result["quiz"].model_dump(),
    }