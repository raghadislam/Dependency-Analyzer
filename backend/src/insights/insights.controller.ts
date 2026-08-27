import { Controller, Get, Query } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { TraversalQueryDto } from '../files/dto/traversal-query.dto';

@Controller('insights')
export class InsightsController {
  constructor(private readonly insights: InsightsService) {}

  @Get('cycles')
  getCycles() {
    return this.insights.getCycles();
  }

  @Get('hotspots')
  getHotspots(@Query('limit') limit?: string) {
    return this.insights.getHotspots(limit ? parseInt(limit, 10) : undefined);
  }

  @Get('module-coupling')
  getModuleCoupling() {
    return this.insights.getModuleCoupling();
  }

  @Get('packages/impact')
  getPackageImpact(@Query('name') name: string, @Query() query: TraversalQueryDto) {
    return this.insights.getPackageImpact(name, query.maxHops ?? 5);
  }
}
