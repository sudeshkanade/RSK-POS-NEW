import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('menu-matrix')
  getMenuMatrix() {
    return this.analyticsService.getMenuEngineeringMatrix();
  }

  @Get('food-cost')
  getFoodCost() {
    return this.analyticsService.getFoodCostReport();
  }
}
