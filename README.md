# 🚀 Renly — Prompt → Live SaaS in 60 Seconds

An AI-powered platform that generates, deploys, and evolves full-stack applications instantly using **Anthropic Claude** and **BuildWithLocus**.

## How It Works

1. **Enter your Locus API key** → connects to your workspace
2. **Describe your app** → "A habit tracker for students with daily streaks"
3. **AI generates code** → React + Express, styled with Tailwind
4. **Auto-deploys on Locus** → live URL in minutes
5. **Iterate** → "Add a weekly progress chart" → updated app live

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Dashboard | Next.js 15, TailwindCSS v4 |
| Backend | NestJS |
| AI | Anthropic Claude |
| State | Zustand |
| Data Fetching | TanStack React Query |
| Deploy Target | BuildWithLocus PaaS |
| Monorepo | Turborepo + pnpm |

## Getting Started

```bash
# Install dependencies
pnpm install

# Set environment variables
cp apps/api/.env.example apps/api/.env
# Edit .env with your ANTHROPIC_API_KEY

# Run both apps in development
pnpm dev
```

**Dashboard:** http://localhost:3000  
**API:** http://localhost:8080

## Project Structure

```
renly/
├── apps/
│   ├── web/          ← Next.js dashboard
│   └── api/          ← NestJS backend
├── packages/
│   └── shared/       ← Shared types
├── .locusbuild       ← Locus deployment config
├── turbo.json        ← Turborepo config
└── pnpm-workspace.yaml
```

## Environment Variables

### `apps/api/.env`
```
ANTHROPIC_API_KEY=sk-ant-...   # Required: Claude API key
PORT=8080                       # Default: 8080
FRONTEND_URL=http://localhost:3000
```

### `apps/web/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Deploy to Locus

Renly deploys itself on Locus:

```bash
# The .locusbuild file handles everything
# Push to your Locus workspace:
git push locus main
```

## Built for the BuildWithLocus Hackathon

> **Hackathon Theme:** "Agents that pay, trust, cooperate, and keep secrets"  
> Renly is an agent-native platform where AI autonomously provisions cloud infrastructure through the Locus API.

---

Built with ♥ using [BuildWithLocus](https://buildwithlocus.com)
