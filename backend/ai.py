import os

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableParallel
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage


load_dotenv()


model = ChatOpenAI(
    model="deepseek/deepseek-chat",
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL"),
    max_tokens=4000,
)


# =========================
# Pydantic Models
# =========================

class StudyNotes(BaseModel):
    summary: str = Field(description="A concise summary of the study material")
    key_concepts: list[str] = Field(
        description="The most important concepts from the study material"
    )
    important_points: list[str] = Field(
        description="Important points a student should remember"
    )


class QuizQuestion(BaseModel):
    question: str = Field(description="The multiple-choice question")
    options: list[str] = Field(
        description="Exactly four possible answers"
    )
    correct_answer: str = Field(
        description="The correct answer from the provided options"
    )
    explanation: str = Field(
        description="A short explanation of why the answer is correct"
    )


class Quiz(BaseModel):
    questions: list[QuizQuestion] = Field(
        description="Exactly five multiple-choice questions"
    )


# =========================
# Structured Models
# =========================

notes_model = model.with_structured_output(StudyNotes)

quiz_model = model.with_structured_output(Quiz)


# =========================
# Prompts
# =========================

notes_prompt = ChatPromptTemplate.from_template(
    """
You are an AI study assistant.

Read the following study material and create clear, useful study notes.

Study material:
{content}

Create:
1. A concise summary
2. The key concepts
3. Important points a student should remember

Keep the explanation easy to understand and faithful to the provided material.

Do not use information that is not supported by the study material.
"""
)


quiz_prompt = ChatPromptTemplate.from_template(
    """
You are an AI quiz generator.

Read the following study material and create a short multiple-choice quiz.

Study material:
{content}

Create exactly 5 questions.

For every question provide:
- The question
- Exactly four options
- The correct answer
- A short explanation of why the answer is correct

Only use information supported by the study material.
"""
)


# =========================
# Chains
# =========================

notes_chain = notes_prompt | notes_model

quiz_chain = quiz_prompt | quiz_model


# =========================
# Parallel Study Chain
# =========================

study_chain = RunnableParallel(
    notes=notes_chain,
    quiz=quiz_chain,
)


# =========================
# Motivation Centre
# =========================
#
# A separate, lightweight conversational chain for the Motivation Centre.
# Reuses the same `model` client (and therefore the same server-side API
# key / base URL) as the study-notes pipeline above — no second AI
# architecture, no key ever touches the client app.

MOTIVATION_SYSTEM_PROMPT = """You are the Motivation Centre companion inside StudyVerse, a study app for students.

Your role: a supportive study companion that helps students process study-related
frustration, regain perspective, regain focus, and take one manageable next step.

Tone:
- empathetic, calm, encouraging, honest, conversational
- slightly witty when appropriate, never robotic
- never excessively cheerful ("YOU GOT THIS!!! 🔥🚀"), never guilt-tripping, never patronizing
- sound like a thoughtful older student/friend, not a corporate assistant

Behavior:
- Listen first, problem-solve second. Don't dump advice or a study plan immediately.
- Ask a useful follow-up question when it helps you understand what's going on.
- Keep replies short-to-medium length, like a real conversation, not an essay.
- Only when it's actually helpful, offer to turn the conversation into a small,
  concrete next step (e.g. a short focused study block). Do not force this —
  sometimes the student just wants to talk.
- If you're given a "StudyVerse context" section, use it naturally and sparingly
  to personalize your response (e.g. referencing an actual improving trend or
  streak). Never recite it like a report or expose raw database details —
  just use it the way a friend who happens to know your recent grades would.
- You are not a therapist and must never present yourself as one. Do not
  diagnose or treat mental health conditions.
- If the student expresses severe hopelessness, self-harm, suicidal thoughts,
  wanting to die, or being in immediate danger, do not attempt to coach or
  motivate them. Respond with care, take it seriously, gently encourage them
  to reach out right now to someone they trust or to local emergency/crisis
  services, and keep your response short and grounded. Do not try to solve
  this with study advice.
"""


def build_motivation_messages(
    message: str,
    history: list[dict] | None = None,
    context: str | None = None,
):
    """Builds the LangChain message list for a single Motivation Centre turn.

    history: list of {"role": "user" | "assistant", "content": str}, oldest first.
    context: a short, pre-summarized StudyVerse context string (streak,
        mastery, recent trend, etc.) — never raw database rows.
    """

    system_content = MOTIVATION_SYSTEM_PROMPT

    if context:
        system_content += f"\n\nStudyVerse context for this student (use sparingly, do not recite verbatim):\n{context}"

    messages = [SystemMessage(content=system_content)]

    for turn in (history or [])[-8:]:
        role = turn.get("role")
        content = turn.get("content", "")

        if not content:
            continue

        if role == "assistant":
            messages.append(AIMessage(content=content))
        else:
            messages.append(HumanMessage(content=content))

    messages.append(HumanMessage(content=message))

    return messages


def generate_motivation_reply(
    message: str,
    history: list[dict] | None = None,
    context: str | None = None,
) -> str:
    messages = build_motivation_messages(message, history, context)
    result = model.invoke(messages)
    return result.content