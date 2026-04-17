import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AppsService } from './apps.service';
import { LocusAuthGuard } from '../auth/guards/locus-auth.guard';
import { Request } from 'express';

@Controller('apps')
@UseGuards(LocusAuthGuard)
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Get()
  listApps() {
    return { success: true, apps: this.appsService.getAllApps() };
  }

  @Get(':id')
  getApp(@Param('id') id: string) {
    return { success: true, app: this.appsService.getApp(id) };
  }
}
