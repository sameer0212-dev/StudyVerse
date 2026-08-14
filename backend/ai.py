import os

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableParallel


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