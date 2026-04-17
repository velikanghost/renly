import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Low-level wrapper around the BuildWithLocus REST API.
 * Every method takes a user JWT — we never store tokens.
 */
@Injectable()
export class LocusApiService {
  private readonly logger = new Logger(LocusApiService.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('locusApiBaseUrl')!;
  }

  // ─── AUTH ───────────────────────────────────────────────────

  async getBalance(token: string): Promise<{ creditBalance: number }> {
    return this.request('GET', '/billing/balance', token);
  }

  async getTransactions(token: string): Promise<any[]> {
    const result = await this.request('GET', '/billing/transactions', token);
    return result.transactions || result || [];
  }

  // ─── PROJECTS ───────────────────────────────────────────────

  async createProject(token: string, name: string): Promise<{
    id: string;
    name: string;
    defaultEnvironmentId?: string;
  }> {
    return this.request('POST', '/projects', token, { name });
  }

  async getProject(token: string, projectId: string): Promise<any> {
    return this.request('GET', `/projects/${projectId}`, token);
  }

  // ─── ENVIRONMENTS ──────────────────────────────────────────

  async createEnvironment(
    token: string,
    projectId: string,
    name: string = 'development',
  ): Promise<{ id: string }> {
    return this.request('POST', `/projects/${projectId}/environments`, token, { 
      name,
      type: name === 'production' ? 'production' : 'development' 
    });
  }

  // ─── SERVICES ───────────────────────────────────────────────

  async createService(
    token: string,
    data: {
      projectId: string;
      environmentId: string;
      name: string;
      source?: any;
    },
  ): Promise<{ id: string; url?: string }> {
    return this.request('POST', '/services', token, data);
  }

  async getService(token: string, serviceId: string): Promise<any> {
    return this.request('GET', `/services/${serviceId}?include=runtime`, token);
  }

  async redeployService(token: string, serviceId: string): Promise<any> {
    return this.request('POST', `/services/${serviceId}/redeploy`, token);
  }

  // ─── DEPLOYMENTS ───────────────────────────────────────────

  async getDeployment(token: string, deploymentId: string): Promise<{
    id: string;
    status: string;
    serviceId?: string;
  }> {
    return this.request('GET', `/deployments/${deploymentId}`, token);
  }

  async getDeploymentLogs(
    token: string,
    deploymentId: string,
  ): Promise<ReadableStream | any> {
    const response = await axios.get(
      `${this.baseUrl}/deployments/${deploymentId}/logs?follow=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'stream',
      },
    );
    return response.data;
  }

  // ─── VARIABLES ──────────────────────────────────────────────

  async setVariables(
    token: string,
    serviceId: string,
    variables: Record<string, string>,
  ): Promise<void> {
    await this.request('PUT', `/variables/service/${serviceId}`, token, { variables });
  }

  // ─── ADDONS ─────────────────────────────────────────────────

  async provisionAddon(
    token: string,
    data: {
      projectId: string;
      environmentId: string;
      type: 'postgres' | 'redis';
      name: string;
    },
  ): Promise<{ id: string }> {
    return this.request('POST', '/addons', token, data);
  }

  // ─── FROM-REPO DEPLOY (one-call) ───────────────────────────

  async deployFromRepo(
    token: string,
    data: { name: string; repo: string; branch?: string },
  ): Promise<any> {
    return this.request('POST', '/projects/from-repo', token, {
      name: data.name,
      repo: data.repo,
      branch: data.branch || 'main',
    });
  }

  // ─── GENERIC REQUEST ──────────────────────────────────────

  private async request(
    method: string,
    path: string,
    token: string,
    body?: any,
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    this.logger.debug(`${method} ${url}`);

    try {
      const response = await axios({
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        data: body,
      });

      // Handle 204 No Content
      if (response.status === 204) {
        return {};
      }

      return response.data;
    } catch (error: any) {
      const errorText = error.response?.data?.message || error.response?.data?.error || error.message;
      this.logger.error(`Locus API error [${error.response?.status || 500}]: ${errorText}`);
      throw new HttpException(
        `Locus API error: ${errorText}`,
        error.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
