# Hargeisa Opportunity Hub

Central platform for students, graduates and young professionals in Hargeisa, Somaliland to discover scholarships, internships, jobs, courses, competitions and training.

**Product vision:** One Platform. Every Opportunity. A Better Future.

## Stack

- Frontend: Next.js (React + TypeScript) + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: SQLite in development, PostgreSQL-ready via Prisma
- AI: Hybrid match scoring + optional LLM explanations (`AI_API_KEY`)

## Quick start

```bash
# Backend
cd backend
copy .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev

# Frontend (new terminal)
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

### Demo accounts

All use password `Password123!`

| Role | Email |
| --- | --- |
| Student | student@hoh.local |
| Admin | admin@hoh.local |
| Organization | org@hoh.local |

Seeded opportunities are marked **Sample data** and are not real openings.

## Environment

See `backend/.env.example` and `frontend/.env.example`.

Never commit `.env` files. Set `AI_API_KEY` only on the backend. Email delivery is skipped in development if SMTP is not configured; verification and reset links are printed to the API console.

## Product rules

1. The platform never invents real opportunities.
2. Expired opportunities are hidden from default search.
3. Organization-submitted listings require admin approval.
4. AI eligibility results are estimates, not guarantees.
5. Opportunity titles are not auto-translated.

## Deployment

- Frontend: Vercel (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`)
- Backend: Render / Railway / VPS with PostgreSQL
- Change Prisma `provider` to `postgresql` and set `DATABASE_URL`
- Run `npx prisma migrate deploy` then `npm run db:seed` only for demo environments
