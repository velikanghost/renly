import { execSync } from 'child_process';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';

export async function init(projectNameArg?: string, options: { template?: string } = {}) {
  const VALID_TEMPLATES = ['nextjs', 'nestjs'];

  let projectName = projectNameArg;
  let template = options.template;

  // Smart Detection: If the first argument is a valid template name and no template option was provided
  if (projectNameArg && VALID_TEMPLATES.includes(projectNameArg) && !template) {
    template = projectNameArg;
    projectName = undefined; // We'll prompt for the project name instead
  }

  if (template && !VALID_TEMPLATES.includes(template)) {
    console.log(chalk.red(`\n✗ Error: Invalid template "${template}". Valid options are: ${VALID_TEMPLATES.join(', ')}\n`));
    process.exit(1);
  }

  if (!projectName) {
    const response = await (inquirer as any).prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name (use "." for current folder):',
        default: '.',
      },
    ]);
    projectName = response.projectName;
  }

  if (!template) {
    const response = await (inquirer as any).prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Which template would you like to use?',
        choices: [
          { name: 'Next.js (App Router, Tailwind, ESLint)', value: 'nextjs' },
          { name: 'NestJS (REST API)', value: 'nestjs' },
        ],
      },
    ]);
    template = response.template;
  }

  const isCurrentDir = projectName === '.';
  const projectDir = isCurrentDir ? process.cwd() : path.join(process.cwd(), projectName!);

  // Check if target directory is empty (if not creating a new sub-dir)
  if (isCurrentDir) {
    const files = await fs.readdir(projectDir);
    if (files.length > 0 && !files.every(f => f.startsWith('.'))) {
      const { confirm } = await (inquirer as any).prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'The current directory is not empty. Continue scaffolding anyway?',
          default: false,
        },
      ]);
      if (!confirm) process.exit(0);
    }
  } else if (await fs.pathExists(projectDir)) {
    console.log(chalk.red(`\n✗ Error: Directory ${projectName} already exists\n`));
    process.exit(1);
  }

  const spinner = ora(`Scaffolding ${template} project...`).start();

  try {
    // 1. Run official CLI
    if (template === 'nextjs') {
      execSync(
        `npx create-next-app@latest ${projectName} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --skip-install --no-git`,
        { stdio: 'ignore' }
      );
    } else if (template === 'nestjs') {
      execSync(
        `npx @nestjs/cli new ${projectName} --package-manager pnpm --skip-install --skip-git`,
        { stdio: 'ignore' }
      );
    }

    // 1.5. Clean up .git directory if it was created (consistency fallback)
    if (!isCurrentDir) {
      const dotGit = path.join(projectDir, '.git');
      if (await fs.pathExists(dotGit)) {
        await fs.remove(dotGit);
      }
    }

    // 2. Overlay Locus config
    await overlayLocusConfig(projectDir, template as any);

    spinner.succeed(chalk.green(`✓ Project ${chalk.bold(projectName)} initialized with proper structure!`));
    console.log(`\nNext steps:`);
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan(`  pnpm install`));
    console.log(chalk.cyan(`  renly deploy`));
    console.log('\n');
  } catch (error: any) {
    spinner.fail(`Scaffolding failed: ${error.message}`);
    process.exit(1);
  }
}

async function overlayLocusConfig(dir: string, template: 'nextjs' | 'nestjs') {
  // .locusbuild
  const locusConfig = {
    services: {
      web: {
        path: '.',
        port: 8080,
        healthCheck: template === 'nextjs' ? '/' : '/health',
      },
    },
  };
  await fs.writeJSON(path.join(dir, '.locusbuild'), locusConfig, { spaces: 2 });

  // Framework Specific Tweaks
  if (template === 'nextjs') {
    await configureNextStandalone(dir);
    await fs.writeFile(path.join(dir, 'Dockerfile'), getNextjsDockerfile());
  } else {
    await fs.writeFile(path.join(dir, 'Dockerfile'), getNestjsDockerfile());
  }
}

async function configureNextStandalone(dir: string) {
  const configPaths = ['next.config.js', 'next.config.mjs'];
  for (const name of configPaths) {
    const fullPath = path.join(dir, name);
    if (await fs.pathExists(fullPath)) {
      let content = await fs.readFile(fullPath, 'utf8');
      if (!content.includes("output: 'standalone'")) {
        // Simple injection before the closing };
        content = content.replace(/}\s*$/, "  output: 'standalone',\n};");
        await fs.writeFile(fullPath, content);
      }
      break;
    }
  }
}

function getNextjsDockerfile() {
  return `ARG STAGE_BASE=base
FROM node:20-slim AS base

# Install dependencies only when needed
FROM \${STAGE_BASE} AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

FROM \${STAGE_BASE} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM \${STAGE_BASE} AS runner
WORKDIR /app
ENV NODE_ENV production
ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 8080
CMD ["node", "server.js"]
`;
}

function getNestjsDockerfile() {
  return `FROM node:20-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
ENV PORT 8080
CMD ["node", "dist/main"]
`;
}

