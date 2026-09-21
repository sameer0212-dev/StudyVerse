from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pypdf import PdfReader
import io

from ai import study_chain, generate_motivation_reply, flashcard_chain


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


# =========================
# Motivation Centre
# =========================

class MotivationHistoryTurn(BaseModel):
    role: str
    content: str


class MotivationChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[MotivationHistoryTurn] = Field(default_factory=list)
    context: str | None = Field(default=None, max_length=2000)


@app.post("/motivation-chat")
async def motivation_chat(payload: MotivationChatRequest):
    message = payload.message.strip()

    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        reply = generate_motivation_reply(
            message=message,
            history=[turn.model_dump() for turn in payload.history],
            context=payload.context,
        )
    except Exception as error:
        print("Motivation chat error:", error)
        raise HTTPException(
            status_code=502,
            detail="The motivation companion is unavailable right now.",
        )

    return {"reply": reply}


# =========================
# Flashcards
# =========================

class FlashcardGenerationRequest(BaseModel):
    summary: str = Field(min_length=1, max_length=20000)
    key_concepts: list[str] = Field(default_factory=list)


@app.post("/generate-flashcards")
async def generate_flashcards(payload: FlashcardGenerationRequest):
    content = payload.summary.strip()

    if payload.key_concepts:
        content += "\n\nKey concepts:\n" + "\n".join(
            f"- {concept}" for concept in payload.key_concepts
        )

    if not content:
        raise HTTPException(
            status_code=400, detail="Study material is empty."
        )

    try:
        result = flashcard_chain.invoke({"content": content})
    except Exception as error:
        print("Flashcard generation error:", error)
        raise HTTPException(
            status_code=502,
            detail="Couldn't generate flashcards right now.",
        )

    return {"flashcards": [card.model_dump() for card in result.flashcards]}