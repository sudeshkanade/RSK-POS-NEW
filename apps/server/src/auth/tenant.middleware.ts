import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host || ''; // e.g. "burgerjoint.restroos.com"
    const subdomain = host.split('.')[0];

    if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain.includes('localhost') === false) {
      const tenant = await this.prisma.restaurant.findUnique({
        where: { slug: subdomain },
      });
      
      if (tenant) {
        (req as any).tenantId = tenant.id;
      }
    }
    next();
  }
}
