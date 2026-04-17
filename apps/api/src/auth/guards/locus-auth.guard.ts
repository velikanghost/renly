import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Guard that extracts the Locus JWT from the Authorization header
 * and attaches it to the request object for downstream services.
 */
@Injectable()
export class LocusAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Locus authorization token');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Empty authorization token');
    }

    // Attach token to request for downstream services
    (request as any).locusToken = token;
    return true;
  }
}
