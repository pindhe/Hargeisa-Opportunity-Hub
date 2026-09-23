# HOH — Hargeisa Opportunity Hub

HOH collects scholarships, jobs, internships, courses, hackathons, and other opportunities for students and young professionals in Hargeisa and Somaliland. The Next.js frontend and FastAPI backend deploy separately.

## Run it locally

The API uses SQLite when `DATABASE_URL` is not set, so you can start without Docker or PostgreSQL.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

Demo accounts:

- Student: `ayaan@uoh.edu.so` / `Student123!`
- Admin: `admin@hargeisaopportunityhub.so` / `Admin123!`

## PostgreSQL

Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL`. With Docker:

```powershell
docker compose up --build
```

Tables are created on API startup. For a migration-based deploy, run `alembic upgrade head` from `backend` before starting the API and set `AUTO_CREATE_TABLES=false`.

## AI assistant

The assistant searches approved opportunities and explains matches from the signed-in profile. Set `OPENAI_API_KEY` if you want the written reply polished by a model. Listings still come only from the database.
