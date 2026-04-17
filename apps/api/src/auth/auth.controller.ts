import { Controller, Post, Body, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Exchange a user's claw_ API key for a Locus JWT.
   * The JWT is returned to the frontend and stored in Zustand (memory only).
   */
  @Post('connect')
  async connect(@Body('apiKey') apiKey: string) {
    if (!apiKey || !apiKey.startsWith('claw_')) {
      throw new UnauthorizedException('Invalid Locus API key. Must start with claw_');
    }

    const result = await this.authService.exchangeKey(apiKey);
    return {
      success: true,
      token: result.token,
      expiresIn: result.expiresIn,
      workspaceId: result.workspaceId,
    };
  }

  /**
   * Verify the user's JWT is still valid and return workspace info.
   */
  @Get('whoami')
  async whoami(@Headers('authorization') authHeader: string) {
    const token = this.authService.extractToken(authHeader);
    const result = await this.authService.whoami(token);
    return { success: true, ...result };
  }
}
