import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { SyncService } from './sync.service';
import { TenantGuard } from '../auth/tenant.guard';
import type { Request } from 'express';

@Controller('sync')
@UseGuards(TenantGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  async push(@Body() data: any, @Req() req: Request) {
    const tenantId = (req as any)['tenantId'];
    return this.syncService.handlePush(tenantId, data);
  }

  @Get('pull')
  async pull(@Query('lastSync') lastSync: string, @Req() req: Request) {
    const tenantId = (req as any)['tenantId'];
    return this.syncService.handlePull(tenantId, lastSync);
  }
}
