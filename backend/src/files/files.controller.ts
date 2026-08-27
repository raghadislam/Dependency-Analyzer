import { Controller, Get, Query } from '@nestjs/common';
import { FilesService } from './files.service';
import { TraversalQueryDto } from './dto/traversal-query.dto';
import { GraphQueryDto } from './dto/graph-query.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  listFiles(@Query('search') search?: string) {
    return this.filesService.listFiles(search);
  }

  @Get('detail')
  getFileSummary(@Query('path') path: string) {
    return this.filesService.getFileSummary(path);
  }

  @Get('blast-radius')
  getBlastRadius(@Query('path') path: string, @Query() query: TraversalQueryDto) {
    return this.filesService.getBlastRadius(path, query.maxHops ?? 5);
  }

  @Get('dependencies')
  getDependencies(@Query('path') path: string, @Query() query: TraversalQueryDto) {
    return this.filesService.getDependencies(path, query.maxHops ?? 5);
  }

  @Get('graph')
  getImpactGraph(@Query('path') path: string, @Query() query: GraphQueryDto) {
    return this.filesService.getImpactGraph(path, query.maxHops ?? 5, query.direction ?? 'dependents');
  }
}
