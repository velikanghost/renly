# Renly ✦ — The Locus Companion CLI

> Renly is a developer utility designed to supercharge the [BuildWithLocus](https://buildwithlocus.com) ecosystem by providing a seamless, CLI-first workflow for scaffolding and deploying applications directly to Locus infrastructure.

Renly eliminates the gap between local development and cloud deployment. It combines the power of modern scaffolding with the scale of Locus Beta.

## Key Locus Integrations

- **Locus-Native Scaffolding**: Automatically overlays Locus-specific configurations (`.locusbuild`, Dockerfiles) onto Next.js and NestJS projects.
- **Git-to-Locus Pipeline**: Simplifies the Locus Git-push deployment workflow through a high-level `renly deploy` command.
- **Unified Workspace Auth**: Uses Locus API keys to authenticate and manage deployments within your Locus workspaces.
- **Locus Dashboard Sync**: Link local projects to Locus Project IDs for instant dashboard access.

## Features

- **Zero-Config Scaffolding**: Production-ready templates optimized for Locus container runtimes.
- **One-Command Deploy**: Pushes code directly to the Locus Git backend with automatic remote configuration.

## Tech Stack

| Component          | Technology                               |
| ------------------ | ---------------------------------------- |
| **CLI**            | TypeScript, Commander, Axios, Simple-Git |
| **Infrastructure** | **BuildWithLocus PaaS**                  |
| **Marketing**      | Next.js 16 (Turbopack), TailwindCS.      |
| **Monorepo**       | Turborepo + pnpm                         |

## Getting Started

### Installation

```bash
npm install -g @renly/cli
```

### Local Setup

1. **Clone & Install**:

   ```bash
   pnpm install
   ```

2. **Run Marketing Site**:
   ```bash
   pnpm dev:web
   ```

## Workflow

### 1. Authenticate with Locus

```bash
renly login
```

### 2. Scaffold for Locus

```bash
renly init nextjs
renly init nestjs
```

### 3. Push to Production

```bash
cd my-locus-app
renly deploy
```

---

Built for the **Locus Paygentic Hackathon** using [BuildWithLocus](https://buildwithlocus.com)
