# PromptCraft

An AI Prompt Engineering Platform — an intent translation engine that converts simple ideas into professional AI prompts across 15 domains.

## Structure

```
AI_PROMPT/
├── apps/
│   ├── web/          # Next.js 14 App Router + TypeScript
│   └── ai-service/   # Python FastAPI — AI inference engine
├── packages/
│   ├── db/           # Prisma schema + migrations
│   └── types/        # Shared TypeScript types
```

## Quick Start

### Web (Next.js)
```bash
cd apps/web
cp .env.local.example .env.local   # fill in values
npm install
npm run dev                         # http://localhost:3000
```

### AI Service (FastAPI)
```bash
cd apps/ai-service
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                # fill in values
uvicorn main:app --reload           # http://localhost:8000
```

### Database (Prisma)
```bash
cd packages/db
npm install
npx prisma generate
npx prisma db push
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python FastAPI |
| Auth | Supabase Auth |
| Primary DB | PostgreSQL (Supabase) |
| Cache | Redis (Upstash) |
| Vector DB | Qdrant |
| Object Store | Cloudflare R2 |
| AI Models | OpenAI, Anthropic, Groq |
| Payments | Stripe |
| Deployment | Vercel (web) + Railway (ai-service) |

## AI Model Routing

| Tier | Model | Cost |
|------|-------|------|
| Free / Simple | Groq Llama 3.1 70B | ~$0.0006/1K tokens |
| Standard | GPT-4o mini | ~$0.0015/1K tokens |
| Premium / Creative | Claude Sonnet | ~$0.015/1K tokens |
| Vision | GPT-4o | ~$0.030/1K tokens |

## Blueprint
See `AI_Prompt_Platform_Blueprint.pdf` for the full technical specification.
