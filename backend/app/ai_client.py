import os
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """Kamu adalah asisten pembelajaran fisika untuk siswa SMA.
Fokus topikmu hanya Hukum Coulomb dan konsep muatan listrik.
Jawab dengan bahasa yang mudah dimengerti siswa SMA.
Jika pertanyaan di luar topik, arahkan kembali ke Hukum Coulomb.
"""

def get_chat_completion(messages: list[dict]) -> str:
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    return response.content[0].text
