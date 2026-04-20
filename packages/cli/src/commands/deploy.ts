import { getStoredToken } from '../utils/config.js'
import { SimpleGit, simpleGit } from 'simple-git'
import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs-extra'
import path from 'path'
import axios from 'axios'

import inquirer from 'inquirer'

export async function deploy() {
  const token = getStoredToken()
  if (!token) {
    console.log(
      chalk.red(
        '\n✗ Error: You must be logged in to deploy. Run "renly login" first.\n',
      ),
    )
    process.exit(1)
  }

  const git: SimpleGit = simpleGit()
  let spinner: any

  try {
    // 1. Verify it's a git repo
    if (!(await git.checkIsRepo())) {
      const { confirm } = await (inquirer as any).prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: chalk.yellow('Current directory is not a Git repository. Initialize it for you?'),
          default: true,
        },
      ]);

      if (confirm) {
        const initSpinner = ora('Initializing Git repository...').start();
        await git.init();
        await git.add('.');
        await git.commit('Initial commit by Renly ✦');
        initSpinner.succeed('Git repository initialized!');
      } else {
        console.log(chalk.red('\n✗ Error: Deployment requires a Git repository.\n'));
        process.exit(1);
      }
    }

    spinner = ora('Preparing deployment...').start()

    // 2. Read .locusbuild
    if (!(await fs.pathExists('.locusbuild'))) {
      spinner.fail(
        'No .locusbuild file found. Use "renly init" to create a new project.',
      )
      process.exit(1)
    }

    // 3. Get or Create Locus Project
    const projectDir = process.cwd()
    const projectName = path.basename(projectDir)
    let projectId = await getProjectIdLinked()

    const baseUrl = 'https://beta-api.buildwithlocus.com/v1';

    if (!projectId) {
      spinner.text = `Creating new project "${projectName}" on Locus (Beta)...`
      try {
        const createRes = await axios.post(
          `${baseUrl}/projects`,
          { name: projectName, region: 'us-east-1' },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        projectId = createRes.data.id
        await linkProjectId(projectId!)
      } catch (err: any) {
        if (err.response?.status === 409) {
          // If 409, we should try to fetch the project ID by name or handle it
          // For now, let's assume it exists and we'll fail if we can't find it later
          spinner.fail('Project name already exists in your workspace.');
          process.exit(1);
        }
        throw err;
      }
    }

    // 3.5. Ensure Environment exists
    spinner.text = 'Checking environment...'
    let environmentId: string | null = null;
    
    // Check for existing environments
    const envsRes = await axios.get(`${baseUrl}/projects/${projectId}/environments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // The API returns { environments: [...] }
    const envs = envsRes.data.environments || envsRes.data;
    
    if (envs.length > 0) {
      environmentId = envs[0].id; // Use the first one (usually production)
    } else {
      spinner.text = 'Creating production environment...';
      try {
        const createEnvRes = await axios.post(
          `${baseUrl}/projects/${projectId}/environments`,
          { name: 'production', type: 'production' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        environmentId = createEnvRes.data.id;
      } catch (err: any) {
        if (err.response?.status === 409) {
          // If 409, fetch again just in case
          const retryEnvsRes = await axios.get(`${baseUrl}/projects/${projectId}/environments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const retryEnvs = retryEnvsRes.data.environments || retryEnvsRes.data;
          environmentId = retryEnvs[0]?.id;
          
          if (!environmentId) {
            spinner.fail(`Environment conflict: 409 reported, but no environments found in project ${projectId}.`);
            console.log(chalk.gray('API Response:'), retryEnvsRes.data);
            process.exit(1);
          }
        } else {
          throw err;
        }
      }
    }

    if (!environmentId) {
      spinner.fail(`Could not identify environment ID for project ${projectId}.`);
      const allEnvsRes = await axios.get(`${baseUrl}/projects/${projectId}/environments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(chalk.gray('Found environments:'), allEnvsRes.data);
      process.exit(1);
    }

    // 4. Ensure Service exists (minimal one-service assumption for CLI alpha)
    spinner.text = 'Syncing service configuration...';
    try {
      await axios.post(
        `${baseUrl}/services`,
        {
          projectId,
          environmentId,
          name: 'web',
          source: { type: 's3', rootDir: '.' },
          runtime: { port: 8080, cpu: 256, memory: 512 }
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
    } catch (err: any) {
      // Ignore 409 (already exists)
      if (err.response?.status !== 409) throw err
    }

    // 5. Setup Remote and Push
    spinner.text = 'Pushing code to Locus Beta...'

    // Get Whoami for Workspace ID
    const whoami = await axios.get(
      `${baseUrl}/auth/whoami`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    const workspaceId = whoami.data.workspaceId

    const remoteUrl = `https://x:${token}@beta-git.buildwithlocus.com/${workspaceId}/${projectId}.git`

    const remotes = await git.getRemotes()
    if (remotes.find((r) => r.name === 'locus')) {
      await git.removeRemote('locus')
    }
    await git.addRemote('locus', remoteUrl)

    spinner.text = 'Deploying... (this may take a minute)'
    const branch = await git.revparse(['--abbrev-ref', 'HEAD'])
    await git.push('locus', branch, ['--force'])

    spinner.succeed(chalk.green(`\n✓ Deployment successful!`))
    console.log(
      chalk.gray(
        `\nView your project at: https://beta.buildwithlocus.com/projects/${projectId}\n`,
      ),
    )
  } catch (error: any) {
    if (spinner) {
      spinner.fail(
        `Deployment failed: ${error.response?.data?.message || error.message}`,
      )
    } else {
      console.log(chalk.red(`\n✗ Deployment failed: ${error.response?.data?.message || error.message}\n`));
    }
    process.exit(1)
  }
}

async function getProjectIdLinked(): Promise<string | null> {
  const configPath = path.join(process.cwd(), '.renly/config.json')
  if (await fs.pathExists(configPath)) {
    const config = await fs.readJSON(configPath)
    return config.projectId || null
  }
  return null
}

async function linkProjectId(id: string) {
  await fs.ensureDir('.renly')
  await fs.writeJSON('.renly/config.json', { projectId: id }, { spaces: 2 })

  // Add to gitignore if not already
  if (await fs.pathExists('.gitignore')) {
    const ignore = await fs.readFile('.gitignore', 'utf8')
    if (!ignore.includes('.renly')) {
      await fs.appendFile('.gitignore', '\n.renly\n')
    }
  }
}
