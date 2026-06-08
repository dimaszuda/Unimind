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

SYSTEM_PROMPT = """
    Kamu adalah Timi, guru fisika Gen Z yang sabar, suportif, dan komunikatif.

    Cara berbicara:
    - Gunakan bahasa Indonesia sehari-hari yang natural.
    - Hindari bahasa yang terlalu formal, kaku, atau terdengar seperti buku pelajaran.
    - Tunjukkan antusiasme dan rasa ingin membantu siswa memahami konsep.
    - Berikan respons yang terasa seperti percakapan, bukan penilaian ujian.
    - Sesekali gunakan ekspresi percakapan yang wajar jika cocok dengan konteks, tetapi jangan berlebihan dan jangan memaksakan slang.
    - Fokus membuat siswa merasa nyaman untuk belajar dan mencoba menjawab.

    LARANGAN:
    - Jangan memberikan jawaban diluar konteks materi Hukum Coulomb.
    - Jika ada pertanyaan diluar konteks, cukup jawab "Timi tidak tahu soal itu, maaf ya."
"""

class Reflection(BaseModel):
    feedback: str = Field(description="Feedback for the student answer")

def reflection_prompt(is_last_question: bool) -> str:
    if is_last_question:
        return f"""
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
    else:
        return f"""
            {SYSTEM_PROMPT}

            Ketika jawaban siswa BENAR atau SESUAI:
            1. Apresiasi bagian yang benar dari jawaban siswa secara spesifik.
            2. Perkuat pemahaman siswa dengan menjelaskan kembali konsep inti secara singkat dan mudah dipahami.

            Ketika jawaban siswa SALAH atau KURANG TEPAT:
            1. Tunjukkan bagian yang kurang tepat tanpa menghakimi.
            2. Jelaskan konsep yang benar dengan bahasa sederhana.
            3. Bantu siswa memahami letak kesalahannya.
            4. Tutup dengan nada yang menyemangati agar siswa tetap mau mencoba.

            Baik jawaban benar maupun salah, selalu beritahu kalau kita akan lanjut ke pertanyaan berikutnya. 
        """
    
SUMMARY_PROMPT = f"""
        Kamu adalah Timi, guru fisika Gen Z yang sabar, suportif, dan komunikatif.

        Buatlah ringkasan singkat tentang hasil semua jawaban siswa dari pertanyaan refleksi.
        - Jika semua jawaban sudah sesuai, berikan afirmasi dan katakan bahwa siswa bisa menanyakan apapun tentang hukum coulomb.
        - Jika terdapat jawaban yang salah, tunjukanlah bagian mana yang salah. 
"""

def lab_prompt(lab_level: int, PANDUAN: str = PANDUAN) -> str:
    PANDUAN_PATH = BASE_DIR / "dictionary" / f"Lab_{lab_level}.md"
    PANDUAN_LAB = PANDUAN_PATH.read_text(encoding="utf-8")
    return f"""
        {SYSTEM_PROMPT}

        ## Panduan Praktikum
        Berikut panduan praktikum yang bisa kamu jadikan referensi.
        Gunakan hanya jika pertanyaan siswa berkaitan dengan panduan di sini.

        {PANDUAN}

        ## Panduan Lab
        Berikut panduan penggunaan Lab Virtual
        {PANDUAN_LAB}
    """

def get_summary(name: str, history: list = None, system_prompt: str = SUMMARY_PROMPT) -> Reflection:
    try:
        contents = f"""
            Nama Siswa: {name}
            """
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": contents})

        response = client.responses.parse(
            model="gpt-4o-mini",
            input=messages,
            text_format=Reflection
        )

        parsed = response.output_parsed
        if parsed is None:
            raise ValueError("Model returned unparseable response")
        
        print(f"📊 Tokens used - Input: {response.usage.input_tokens}, Output: {response.usage.output_tokens}, Total: {response.usage.input_tokens + response.usage.output_tokens}")
        return parsed
    except Exception as e:
        return f"Error occured - {e}"

def reflection_service(name: str, last_question: bool, question: str, answer: str, history: list = None) -> Reflection:
    try:
        contents = f"""
            Pertanyaan: {question}
            Jawaban Siswa: {answer}
            Nama Siswa: {name}
            """
        system_prompt = reflection_prompt(is_last_question=last_question)
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": contents})

        response = client.responses.parse(
            model="gpt-4o-mini",
            input=messages,
            text_format=Reflection
        )

        parsed = response.output_parsed
        if parsed is None:
            raise ValueError("Model returned unparseable response")
        
        print(f"📊 Tokens used - Input: {response.usage.input_tokens}, Output: {response.usage.output_tokens}, Total: {response.usage.input_tokens + response.usage.output_tokens}")
        return parsed
    except Exception as e:
        return f"Error occured - {e}"

def get_chat_completion(name: str, message: str, history: list = None, system_prompt: str = SYSTEM_PROMPT) -> str:
    try:
        contents = f"""
            Nama Siswa: {name}
            pertanyaan: {message}
            """

        messages = [{"role": "system", "content": system_prompt}]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": contents})

        response = client.responses.parse(
            model="gpt-4o-mini",
            input=messages,
            text_format=Reflection
        )

        parsed = response.output_parsed
        if parsed is None:
            raise ValueError("Model returned unparseable response")

        return parsed
    except Exception as e:
        return f"Error occured - {e}"
    
def lab_chat(name: str, message: str, lab: str, history: list = None) -> str:
    try:
        system_prompt = lab_prompt(lab)
        contents = f"""
            Nama Siswa: {name}
            pertanyaan: {message}
            """

        messages = [{"role": "system", "content": system_prompt}]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": contents})

        response = client.responses.parse(
            model="gpt-4o-mini",
            input=messages,
            text_format=Reflection
        )

        parsed = response.output_parsed
        if parsed is None:
            raise ValueError("Model returned unparseable response")

        return parsed
    except Exception as e:
        return f"Error occured - {e}"