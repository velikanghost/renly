#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { login } from './commands/login.js';
import { init } from './commands/init.js';
import { deploy } from './commands/deploy.js';
import { env, addon, domain, logs } from './commands/placeholders.js';

const program = new Command();

program
  .name('renly')
  .description('Renly CLI — Scaffold and deploy with ease')
  .version('0.1.0');

program
  .command('login')
  .description('Authenticate with your Locus API Key')
  .action(login);

program
  .command('init')
  .description('Scaffold a new project (nextjs, nestjs)')
  .argument('[template]', 'Template to use (nextjs | nestjs)')
  .action(init);

program
  .command('deploy')
  .description('Deploy the current project to Locus')
  .action(deploy);

program
  .command('env')
  .description('Manage project environment variables')
  .action(env);

program
  .command('addon')
  .description('Manage Locus addons (postgres, redis)')
  .action(addon);

program
  .command('domain')
  .description('Manage custom domains')
  .action(domain);

program
  .command('logs')
  .description('Stream real-time container logs')
  .action(logs);

program.parse();
