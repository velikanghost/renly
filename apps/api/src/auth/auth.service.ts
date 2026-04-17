import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly locusApiBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.locusApiBaseUrl = this.configService.get<string>('locusApiBaseUrl')!;
  }

  /**
   * Exchange a claw_ API key for a Locus JWT token.
   * POST /v1/auth/exchange
   */
  async exchangeKey(apiKey: string): Promise<{
    token: string;
    expiresIn: string;
    workspaceId: string;
  }> {
    try {
      const response = await axios.post(`${this.locusApiBaseUrl}/auth/exchange`, { apiKey });
      const data = response.data;
      return {
        token: data.token || data.jwt,
        expiresIn: data.expiresIn || '30d',
        workspaceId: data.workspaceId,
      };
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message;
      throw new UnauthorizedException(`Locus auth failed: ${msg}`);
    }
  }

  /**
   * Verify a JWT is still valid.
   * GET /v1/auth/whoami
   */
  async whoami(token: string): Promise<{
    workspaceId: string;
    email?: string;
    accountType?: string;
  }> {
    try {
      const response = await axios.get(`${this.locusApiBaseUrl}/auth/whoami`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw new UnauthorizedException('Invalid or expired Locus token');
    }
  }

  /**
   * Refresh an expired JWT.
   * POST /v1/auth/refresh
   */
  async refreshToken(token: string): Promise<{ token: string; expiresIn: string }> {
    try {
      const response = await axios.post(
        `${this.locusApiBaseUrl}/auth/refresh`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = response.data;
      return {
        token: data.token || data.jwt,
        expiresIn: data.expiresIn || '30d',
      };
    } catch (error: any) {
      throw new UnauthorizedException('Failed to refresh Locus token');
    }
  }

  /**
   * Extract Bearer token from Authorization header.
   */
  extractToken(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    return authHeader.replace('Bearer ', '');
  }
}
