import os
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel, Field
from pathlib import Path

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
BASE_DIR = Path(__file__).resolve().parent
PANDUAN_PATH = BASE_DIR / "dictionary" / "LKPD_hukum_coulomb.md"
PANDUAN = PANDUAN_PATH.read_text(encoding="utf-8")

SYSTEM_PROMPT = """K
    Kamu adalah Timi, guru fisika Gen Z yang sabar, suportif, dan komunikatif.

    Cara berbicara:
    - Gunakan bahasa Indonesia sehari-hari yang natural.
    - Hindari bahasa yang terlalu formal, kaku, atau terdengar seperti buku pelajaran.
    - Tunjukkan antusiasme dan rasa ingin membantu siswa memahami konsep.
    - Berikan respons yang terasa seperti percakapan, bukan penilaian ujian.
    - Sesekali gunakan ekspresi percakapan yang wajar jika cocok dengan konteks, tetapi jangan berlebihan dan jangan memaksakan slang.
    - Fokus membuat siswa merasa nyaman untuk belajar dan mencoba menjawab.

    LARANGAN:
    - Jangan memberikan jawaban diluar konteks materi Fisika.
    - Jika ada pertanyaan diluar konteks, cukup jawab "Timi tidak tahu soal itu, maaf ya."
"""

class Reflection(BaseModel):
    feedback: str = Field(description="Feedback for the student answer")

REFLECTION_PROMPT = f"""
    {SYSTEM_PROMPT}

    Ketika jawaban siswa BENAR atau SESUAI:
    1. Apresiasi bagian yang benar dari jawaban siswa secara spesifik.
    2. Perkuat pemahaman siswa dengan menjelaskan kembali konsep inti secara singkat dan mudah dipahami.

    Ketika jawaban siswa SALAH atau KURANG TEPAT:
    1. Tunjukkan bagian yang kurang tepat tanpa menghakimi.
    2. Jelaskan konsep yang benar dengan bahasa sederhana.
    3. Bantu siswa memahami letak kesalahannya.
    4. Tutup dengan nada yang menyemangati agar siswa tetap mau mencoba.
"""

LAB_PROMPT = f"""
    {SYSTEM_PROMPT}

    ## Panduan Praktikum
    Berikut panduan praktikum yang bisa kamu jadikan referensi.
    Gunakan hanya jika pertanyaan siswa berkaitan dengan panduan di sini.

    {PANDUAN}
"""


def reflection_service(name: str, question_number: int, question: str, answer: str, system_prompt: str = REFLECTION_PROMPT) -> Reflection:
    try:
        contents = f"""
            Nomor pertanyaan: {question_number}
            Pertanyaan: {question}
            Jawaban Siswa: {answer}
            Nama Siswa: {name}
            """

        response = client.responses.parse(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": contents}
            ],
            text_format=Reflection
        )

        parsed = response.output_parsed
        if parsed is None:
            raise ValueError("Model returned unparseable response")

        return parsed
    except Exception as e:
        return f"Error occured - {e}"

def get_chat_completion(name: str, message: str, system_prompt: str = SYSTEM_PROMPT) -> str:
    try:
        contents = f"""
            Nama Siswa: {name}
            pertanyaan: {message}
            """

        response = client.responses.parse(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": contents}
            ],
            text_format=Reflection
        )

        parsed = response.output_parsed
        if parsed is None:
            raise ValueError("Model returned unparseable response")

        return parsed
    except Exception as e:
        return f"Error occured - {e}"
    
def lab_chat(name: str, message: str, system_prompt: str = LAB_PROMPT) -> str:
    try:
        contents = f"""
            Nama Siswa: {name}
            pertanyaan: {message}
            """

        response = client.responses.parse(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": contents}
            ],
            text_format=Reflection
        )

        parsed = response.output_parsed
        if parsed is None:
            raise ValueError("Model returned unparseable response")

        return parsed
    except Exception as e:
        return f"Error occured - {e}"