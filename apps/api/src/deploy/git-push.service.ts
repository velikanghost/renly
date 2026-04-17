import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { simpleGit, SimpleGit } from 'simple-git';
import { GeneratedFile } from '../codegen/codegen.service';

@Injectable()
export class GitPushService {
  private readonly logger = new Logger(GitPushService.name);
  private readonly locusGitBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.locusGitBaseUrl = this.configService.get<string>('locusGitBaseUrl')!;
  }

  /**
   * Takes in-memory generated files, writes them to a temp directory,
   * initializes a git repo, and pushes to the Locus git server.
   *
   * Remote URL format: https://x:{jwt}@git.buildwithlocus.com/{workspaceId}/{projectId}.git
   */
  async pushToLocus(
    files: GeneratedFile[],
    token: string,
    workspaceId: string,
    projectId: string,
  ): Promise<void> {
    const tmpDir = path.join(os.tmpdir(), `renly-${projectId}-${Date.now()}`);

    try {
      this.logger.log(`Creating temp directory: ${tmpDir}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      // Write all generated files to the temp directory
      for (const file of files) {
        const filePath = path.join(tmpDir, file.path);
        const dir = path.dirname(filePath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, file.content, 'utf-8');
      }

      this.logger.log(`Wrote ${files.length} files to temp directory`);

      // Initialize git repo
      const git: SimpleGit = simpleGit(tmpDir);
      await git.init();
      await git.addConfig('user.email', 'renly@buildwithlocus.com');
      await git.addConfig('user.name', 'Renly AI');

      // Add and commit all files
      await git.add('.');
      await git.commit('Initial deploy from Renly');

      // Ensure the branch is explicitly named 'main'
      await git.branch(['-M', 'main']);

      // Add Locus remote and push
      const remoteUrl = `${this.locusGitBaseUrl}/${workspaceId}/${projectId}.git`
        .replace('https://', `https://x:${token}@`);

      await git.addRemote('locus', remoteUrl);
      
      this.logger.log(`Pushing to Locus git server...`);
      await git.push('locus', 'main', ['--force']);
      this.logger.log(`Successfully pushed to Locus`);
    } finally {
      // Clean up temp directory
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        this.logger.debug(`Cleaned up temp directory: ${tmpDir}`);
      } catch (err) {
        this.logger.warn(`Failed to clean up temp dir: ${err.message}`);
      }
    }
  }

  /**
   * Push updated files for an iteration (same flow, different commit message).
   */
  async pushUpdate(
    files: GeneratedFile[],
    token: string,
    workspaceId: string,
    projectId: string,
    changeDescription: string,
  ): Promise<void> {
    const tmpDir = path.join(os.tmpdir(), `renly-update-${projectId}-${Date.now()}`);

    try {
      fs.mkdirSync(tmpDir, { recursive: true });

      for (const file of files) {
        const filePath = path.join(tmpDir, file.path);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, file.content, 'utf-8');
      }

      const git: SimpleGit = simpleGit(tmpDir);
      await git.init();
      await git.addConfig('user.email', 'renly@buildwithlocus.com');
      await git.addConfig('user.name', 'Renly AI');

      await git.add('.');
      await git.commit(`Renly update: ${changeDescription}`);

      // Ensure the branch is explicitly named 'main'
      await git.branch(['-M', 'main']);

      const remoteUrl = `${this.locusGitBaseUrl}/${workspaceId}/${projectId}.git`
        .replace('https://', `https://x:${token}@`);

      await git.addRemote('locus', remoteUrl);
      await git.push('locus', 'main', ['--force']);

      this.logger.log(`Pushed iteration update to Locus`);
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (err) {
        this.logger.warn(`Failed to clean up: ${err.message}`);
      }
    }
  }
}
