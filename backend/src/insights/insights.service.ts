import { Injectable } from '@nestjs/common';
import neo4j from 'neo4j-driver';
import { Neo4jService } from '../neo4j/neo4j.service';

export interface CycleResult {
  cycle: string[];
}

export interface HotspotResult {
  path: string;
  module: string;
  layer: string;
  fanIn: number;
}

export interface CouplingResult {
  fromModule: string;
  toModule: string;
  edgeCount: number;
}

export interface PackageImpactResult {
  path: string;
  module: string;
  layer: string;
  hops: number;
}

@Injectable()
export class InsightsService {
  constructor(private readonly neo4j: Neo4jService) {}

  async getCycles(maxLen = 8): Promise<CycleResult[]> {
    return this.neo4j.read<CycleResult>(
      `
      MATCH p = (f:File)-[:IMPORTS*2..${maxLen}]->(f)
      RETURN DISTINCT [n IN nodes(p) | n.path] AS cycle
      LIMIT 20
      `,
    );
  }


  async getHotspots(limit = 15): Promise<HotspotResult[]> {
    return this.neo4j.read<HotspotResult>(
      `
      MATCH (f:File)<-[:IMPORTS]-(dependent:File)
      WITH f, count(DISTINCT dependent) AS fanIn
      RETURN f.path AS path, f.module AS module, f.layer AS layer, fanIn
      ORDER BY fanIn DESC
      LIMIT $limit
      `,
      { limit: neo4j.int(limit) },
    );
  }

  async getModuleCoupling(): Promise<CouplingResult[]> {
    return this.neo4j.read<CouplingResult>(
      `
      MATCH (a:File)-[:IMPORTS]->(b:File)
      WHERE a.module <> b.module
      RETURN a.module AS fromModule, b.module AS toModule, count(*) AS edgeCount
      ORDER BY edgeCount DESC
      `,
    );
  }

  async getPackageImpact(packageName: string, maxHops: number): Promise<PackageImpactResult[]> {
    return this.neo4j.read<PackageImpactResult>(
      `
      MATCH (:Package {name: $packageName})<-[:DEPENDS_ON]-(direct:File)
      MATCH p = (direct)<-[:IMPORTS*0..${maxHops}]-(affected:File)
      WITH affected, min(length(p)) AS hops
      RETURN affected.path AS path, affected.module AS module, affected.layer AS layer, hops
      ORDER BY hops ASC, path ASC
      `,
      { packageName },
    );
  }
}
