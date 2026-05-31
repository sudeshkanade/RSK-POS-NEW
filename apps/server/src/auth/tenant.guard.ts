import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class TenantGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // 1. Check for JWT in Authorization header (Primary for SaaS)
    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        // Mocking JWT verification logic
        // const payload = await this.jwtService.verify(token);
        // request['tenantId'] = payload.restaurantId;
        // return true;
        console.log('JWT detected - verifying token...');
      } catch (e) {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    // 2. Fallback to custom headers for POS internal sync
    const tenantId = request.headers['x-tenant-id'] as string;
    const licenseKey = request.headers['x-license-key'] as string;

    if (!tenantId && !licenseKey) {
      throw new UnauthorizedException('Terminal Session Expired: Please restart the application to restore your connection.');
    }

    const req = request as any;
    req['tenantId'] = tenantId;
    req['licenseKey'] = licenseKey;
    
    return true;
  }
}
