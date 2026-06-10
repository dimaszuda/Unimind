# intent_classifier.py
import re
from enum import Enum
from functools import lru_cache

# ─── Threshold & keyword config ───────────────────────────────────────────────

LAB_KEYWORDS = [
    # instruksi lab
    "langkah", "langkah-langkah", "prosedur", "cara", "bagaimana", "gimana",
    "petunjuk", "panduan", "instruksi", "tutorial",
    # objek lab
    "lab", "virtual", "simulasi", "percobaan", "praktikum", "modul",
    "alat", "bahan", "rangkaian", "komponen", "perangkat",
    # aksi teknis
    "klik", "tekan", "pilih", "buka", "jalankan", "setting", "konfigurasi",
    "install", "input", "output", "hasil", "ukur", "catat", "amati",
    # error/troubleshoot
    "error", "gagal", "tidak bisa", "kenapa", "mengapa", "masalah", "bug",
]

SMALLTALK_KEYWORDS = [
    "halo", "hai", "hey", "apa kabar", "siapa kamu", "kamu bisa",
    "lucu", "bercanda", "jokes", "kayang", "nyanyi", "joget",
    "selamat", "makasih", "terima kasih", "oke", "sip", "mantap",
]

AMBIGUITY_THRESHOLD = 0.0  # skor 0 = tidak ada sinyal kuat → ambigu


class Intent(str, Enum):
    LAB = "lab"          # butuh PANDUAN_LAB
    GENERAL = "general"  # tidak butuh PANDUAN_LAB
    AMBIGUOUS = "ambiguous"


# ─── Stage 1: Keyword scorer ──────────────────────────────────────────────────

def _keyword_score(text: str) -> tuple[int, int]:
    """Return (lab_hits, smalltalk_hits)."""
    lowered = text.lower()
    lab_hits = sum(1 for kw in LAB_KEYWORDS if re.search(rf"\b{re.escape(kw)}\b", lowered))
    smalltalk_hits = sum(1 for kw in SMALLTALK_KEYWORDS if re.search(rf"\b{re.escape(kw)}\b", lowered))
    return lab_hits, smalltalk_hits


def keyword_classify(message: str) -> Intent:
    lab_hits, smalltalk_hits = _keyword_score(message)

    if lab_hits >= 2:
        return Intent.LAB
    if lab_hits == 1 and smalltalk_hits == 0:
        return Intent.LAB
    if smalltalk_hits >= 1 and lab_hits == 0:
        return Intent.GENERAL
    return Intent.AMBIGUOUS  # → lanjut ke LLM


# ─── Stage 2: LLM classifier (hanya kalau ambigu) ────────────────────────────

CLASSIFIER_SYSTEM = """
Kamu adalah classifier intent. Tugasmu HANYA menentukan apakah pertanyaan siswa
membutuhkan panduan/konteks laboratorium virtual untuk dijawab.

Jawab HANYA dengan salah satu:
- "lab"      → pertanyaan tentang prosedur, alat, error, atau hal teknis di lab virtual
- "general"  → pertanyaan umum, basa-basi, atau tidak berkaitan dengan lab

Jangan tambahkan penjelasan apapun.
""".strip()


def llm_classify(message: str, client) -> Intent:
    """Minimal LLM call — model kecil, max_tokens=5, no history, no tools."""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=5,
            temperature=0,
            messages=[
                {"role": "system", "content": CLASSIFIER_SYSTEM},
                {"role": "user", "content": message},
            ],
        )
        result = response.choices[0].message.content.strip().lower()
        return Intent.LAB if "lab" in result else Intent.GENERAL
    except Exception:
        return Intent.LAB  # fail-safe: kalau error, anggap butuh lab


# ─── Public API ───────────────────────────────────────────────────────────────

def classify_intent(message: str, client=None) -> Intent:
    """
    Stage 1 → keyword check (0 token).
    Stage 2 → LLM hanya kalau ambigu.
    """
    intent = keyword_classify(message)
    if intent == Intent.AMBIGUOUS:
        if client is None:
            return Intent.LAB  # fail-safe tanpa client
        intent = llm_classify(message, client)
    return intent