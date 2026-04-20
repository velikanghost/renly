import inquirer from 'inquirer'
import chalk from 'chalk'
import { setStoredToken } from '../utils/config.js'
import axios from 'axios'
import ora from 'ora'

export async function login() {
  console.log(chalk.bold.hex('#6366f1')('\n✦ Welcome to Renly\n'))

  const { apiKey } = await (inquirer as any).prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your Locus API Key:',
      validate: (input: string) => input.length > 0 || 'API Key is required',
    },
  ])

  const baseUrl = 'https://beta-api.buildwithlocus.com/v1';

  try {
    const spinner = ora('Authenticating with Locus Beta...').start()

    // 1. Exchange API key for JWT token
    const exchangeRes = await axios.post(
      `${baseUrl}/auth/exchange`,
      {
        apiKey,
      },
    )

    const token = exchangeRes.data.token

    // 2. Validate token by calling whoami
    const whoamiRes = await axios.get(
      `${baseUrl}/auth/whoami`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    setStoredToken(token)
    spinner.succeed(
      chalk.green(
        `\n✓ Success! Logged in as ${chalk.bold(whoamiRes.data.email)}`,
      ),
    )
    console.log(chalk.gray(`Workspace: ${whoamiRes.data.workspaceId}\n`))
  } catch (error: any) {
    console.log(
      chalk.red(
        `\n✗ Error: ${error.response?.data?.message || error.message || 'Login failed'}`,
      ),
    )
    process.exit(1)
  }
}
