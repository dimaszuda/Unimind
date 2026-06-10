import uuid
import json
import os
from dotenv import load_dotenv
import numpy as np
from openai import OpenAI
from upstash_redis import Redis
from upstash_vector import Index

load_dotenv()
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class SemanticCache:
    def __init__(self, threshold: float = 0.92, ttl: int = 60 * 60 * 24):
        """
        threshold : cosine similarity minimum untuk dianggap cache hit (0–1)
        ttl       : time-to-live untuk Redis entry dalam detik (default 7 hari)
        """
        self.threshold = threshold
        self.ttl = ttl

        self.redis = Redis.from_env()
        self.vector_index = Index.from_env()

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _embed(self, text: str) -> list[float]:
        """Embed teks pakai OpenAI text-embedding-3-small."""
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        return response.data[0].embedding

    def _redis_key(self, cache_id: str) -> str:
        return f"lab_cache:{cache_id}"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get(self, question: str, lab: str):
        """
        Cari cache. Return answer jika hit, None jika miss.
        """
        vector = self._embed(question)

        results = self.vector_index.query(
            vector=vector,
            top_k=1,
            include_metadata=True,
        )

        if not results:
            print("❌ Cache MISS — vector index kosong")
            return None

        best = results[0]
        score = best.score
        meta = best.metadata or {}

        # Pastikan lab sama dan similarity cukup tinggi
        if score >= self.threshold and meta.get("lab") == lab:
            cache_id = meta.get("cache_id")
            print(f"✅ Cache HIT! Similarity: {score:.4f} | id: {cache_id}")

            raw = self.redis.get(self._redis_key(cache_id))
            if raw is None:
                # Vector ada tapi Redis entry sudah expired → treat as miss
                print("⚠️  Redis entry expired, treating as MISS")
                return None

            return json.loads(raw)

        print(f"❌ Cache MISS — best similarity: {score:.4f} (threshold: {self.threshold})")
        return None

    def set(self, question: str, lab: str, answer) -> str:
        """
        Simpan ke cache. Return cache_id yang dipakai.
        """
        cache_id = str(uuid.uuid4())
        vector = self._embed(question)

        # Simpan answer di Redis (dengan TTL)
        self.redis.set(
            self._redis_key(cache_id),
            json.dumps(answer),  # answer harus JSON-serializable
            ex=self.ttl,
        )

        # Simpan vector + metadata di Upstash Vector
        self.vector_index.upsert(
            vectors=[
                {
                    "id": cache_id,
                    "vector": vector,
                    "metadata": {
                        "cache_id": cache_id,
                        "question": question,
                        "lab": lab,
                    },
                }
            ]
        )

        print(f"💾 Cached! id: {cache_id} | lab: {lab}")
        return cache_id

    def delete(self, cache_id: str) -> None:
        """Hapus satu entry dari Redis dan Vector (opsional, untuk admin)."""
        self.redis.delete(self._redis_key(cache_id))
        self.vector_index.delete(ids=[cache_id])
        print(f"🗑️  Deleted cache entry: {cache_id}")


# Inisialisasi sekali di level module
cache = SemanticCache(threshold=0.85)