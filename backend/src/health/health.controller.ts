import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';

@Controller('health')
export class HealthController {
  constructor(private readonly neo4j: Neo4jService) {}

  @Get('db')
  async checkDb(): Promise<{ status: 'up' }> {
    const reachable = await this.neo4j.verifyConnectivity();
    if (!reachable) {
      throw new ServiceUnavailableException({
        status: 'down',
        message:
          'Cannot reach CognoDB. Check that your instance is running and COGNODB_URI/USER/PASSWORD are correct.',
      });
    }
    return { status: 'up' };
  }
}
