# Unimind — Virtual Lab Fisika Hukum Coulomb

Web app simulasi interaktif Hukum Coulomb untuk siswa SMA. Siswa bisa menempatkan muatan, menggeser slider, dan mengamati gaya Coulomb secara visual. Dilengkapi AI chatbot sebagai asisten belajar.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Vite + React + Pixi.js |
| State | Zustand |
| Styling | Tailwind CSS |
| Backend | FastAPI (Python) |
| AI | Anthropic SDK |
| Database & Auth | Supabase |
| Deploy FE | Vercel |
| Deploy BE | Railway |

## Struktur Repo (Monorepo)

```
Unimind/
├── frontend/        # Vite + React + Pixi.js
└── backend/         # FastAPI + Anthropic + Supabase
```

## Arsitektur

```
[Pixi.js Canvas]  <-->  [Zustand Store]  <-->  [React UI]
                               |
                     [useMonitoring Hook]
                     (Rule Engine — client only)
                               |
                     [FastAPI — 2 endpoints]
                     POST /chat         --> Anthropic API
                     POST /log-session  --> Supabase
```

## Setup — Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Akses di `http://localhost:5173`

### Environment Variables (frontend)

```
VITE_API_BASE_URL=http://localhost:8000
```

## Setup — Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

API berjalan di `http://localhost:8000`

### Environment Variables (backend)

```
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

## Endpoints

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/chat` | AI chatbot via Anthropic |
| POST | `/log-session` | Simpan session ke Supabase |

## Fitur

- **Virtual Lab** — Simulasi Hukum Coulomb dengan fisika real-time (gaya Coulomb, damping, collision)
- **Rule-Based Monitoring** — Deteksi AFK dan hint otomatis, pure frontend
- **AI Chatbot** — Halaman terpisah, fokus topik Hukum Coulomb
- **Session Logging** — Time spent + chat history tersimpan untuk guru

## Supabase Schema

```sql
create table session_logs (
  id uuid default gen_random_uuid() primary key,
  student_id text not null,
  time_spent_seconds integer not null,
  chat_history jsonb not null,
  created_at timestamp with time zone default now()
);
```
