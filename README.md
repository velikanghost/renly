# Renly — Locus Companion CLI

Renly is the ultimate developer utility for the [BuildWithLocus](https://buildwithlocus.com) ecosystem. It provides a seamless, CLI-first workflow for scaffolding production-ready projects and deploying them directly to Locus infrastructure in seconds.

## Features

- **One-Command Scaffolding**: Create Next.js or NestJS projects pre-configured for Locus.
- **Smart Containerization**: Automatically generates optimized Dockerfiles (using Next.js Standalone mode).
- **Zero-Config Deployment**: Pushes code directly to Locus Git remotes with auto-provisioning.
- **Integrated Auth**: Syncs with your Locus API keys for secure, workspace-aware management.

---

## Getting Started

### 1. Installation

Clone this repository and link the CLI locally:

```bash
pnpm install
cd packages/cli
pnpm run build
npm link
```

### 2. Login

Authenticate your CLI with your Locus API Key (get it from the Locus Dashboard).

```bash
renly login
```

### 3. Initialize a Project

Scaffold a new project. Renly will handle the Next.js setup, Dockerfile generation, and Locus configuration.

```bash
# Scaffold a Next.js project
renly init my-app -t nextjs

# Or use the interactive prompt
renly init
```

### 4. Deploy

Push your project to Locus. Renly automatically creates the Locus Project, Environment, and Service if they don't exist.

```bash
cd my-app
renly deploy
```

---

## CLI Reference

| Command             | Description                                                   |
| :------------------ | :------------------------------------------------------------ |
| `renly login`       | Securely store your Locus API Key.                            |
| `renly init <name>` | Scaffold a project. Supports `--template nextjs` or `nestjs`. |
| `renly deploy`      | Build and push the current directory to Locus.                |
| `renly logs`        | Stream real-time container logs (Placeholder).                |
| `renly addon`       | Manage Locus Addons like Postgres or Redis (Placeholder).     |

---

## How it Works

1.  **Framework Optimization**: During `renly init`, we patch `next.config.js` to enable `output: 'standalone'`. This drastically reduces container size and increases reliability on Locus.
2.  **Dockerfile Injection**: We inject a hardened `Dockerfile` designed specifically for the Locus runtime (listening on Port 8080).
3.  **Locus Sync**: `renly deploy` uses the Locus Beta API to orchestrate the infrastructure creation, ensuring your app has a home before the code is even pushed.

---

Built for the **Locus Paygentic Hackathon** using [BuildWithLocus](https://buildwithlocus.com) | [Business Plan](./business_plan.md)
