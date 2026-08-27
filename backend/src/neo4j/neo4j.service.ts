import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import neo4j, { Driver, Record as Neo4jRecord, Session } from 'neo4j-driver';
import { NEO4J_DRIVER } from './neo4j.constants';

@Injectable()
export class Neo4jService implements OnModuleDestroy {
  private readonly logger = new Logger(Neo4jService.name);

  constructor(@Inject(NEO4J_DRIVER) private readonly driver: Driver) {}

  async read<T = Record<string, any>>(
    cypher: string,
    params: Record<string, any> = {},
  ): Promise<T[]> {
    return this.run<T>(cypher, params, 'READ');
  }

  async write<T = Record<string, any>>(
    cypher: string,
    params: Record<string, any> = {},
  ): Promise<T[]> {
    return this.run<T>(cypher, params, 'WRITE');
  }

  private async run<T>(
    cypher: string,
    params: Record<string, any>,
    mode: 'READ' | 'WRITE',
  ): Promise<T[]> {
    const session: Session = this.driver.session({
      defaultAccessMode: mode === 'READ' ? neo4j.session.READ : neo4j.session.WRITE,
    });

    try {
      const result =
        mode === 'READ'
          ? await session.executeRead((tx) => tx.run(cypher, params))
          : await session.executeWrite((tx) => tx.run(cypher, params));

      return result.records.map((record: Neo4jRecord) => record.toObject() as T);
    } catch (err) {
      this.logger.error(`Cypher ${mode} failed: ${(err as Error).message}`);
      throw err;
    } finally {
      await session.close();
    }
  }

  async verifyConnectivity(): Promise<boolean> {
    try {
      await this.driver.verifyConnectivity();
      return true;
    } catch (err) {
      this.logger.warn(`CognoDB unreachable: ${(err as Error).message}`);
      return false;
    }
  }

  async onModuleDestroy() {
    await this.driver.close();
  }
}
