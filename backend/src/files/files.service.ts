import { Injectable, NotFoundException } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';

export interface FileSummary {
  path: string;
  module: string;
  layer: string;
  fanIn: number;
  fanOut: number;
}

export interface TraversalNode {
  path: string;
  module: string;
  layer: string;
  hops: number;
}

@Injectable()
export class FilesService {
  constructor(private readonly neo4j: Neo4jService) {}

  async listFiles(search?: string): Promise<FileSummary[]> {
    const rows = await this.neo4j.read<{
      path: string;
      module: string;
      layer: string;
      fanIn: number;
      fanOut: number;
    }>(
      `
      MATCH (f:File)
      WHERE $search IS NULL OR toLower(f.path) CONTAINS toLower($search)
      OPTIONAL MATCH (f)<-[:IMPORTS]-(dependent:File)
      OPTIONAL MATCH (f)-[:IMPORTS]->(dependency:File)
      WITH f, count(DISTINCT dependent) AS fanIn, count(DISTINCT dependency) AS fanOut
      RETURN f.path AS path, f.module AS module, f.layer AS layer, fanIn, fanOut
      ORDER BY fanIn DESC, path ASC
      `,
      { search: search ?? null },
    );
    return rows;
  }

  async getFileSummary(path: string): Promise<FileSummary> {
    const rows = await this.neo4j.read<FileSummary>(
      `
      MATCH (f:File {path: $path})
      OPTIONAL MATCH (f)<-[:IMPORTS]-(dependent:File)
      OPTIONAL MATCH (f)-[:IMPORTS]->(dependency:File)
      RETURN f.path AS path, f.module AS module, f.layer AS layer,
             count(DISTINCT dependent) AS fanIn, count(DISTINCT dependency) AS fanOut
      `,
      { path },
    );
    if (rows.length === 0) {
      throw new NotFoundException(`No file found with path "${path}"`);
    }
    return rows[0];
  }


  async getBlastRadius(path: string, maxHops: number): Promise<TraversalNode[]> {
    await this.getFileSummary(path);

    return this.neo4j.read<TraversalNode>(
      `
      MATCH p = (target:File {path: $path})<-[:IMPORTS*1..${maxHops}]-(dependent:File)
      WITH dependent, min(length(p)) AS hops
      RETURN dependent.path AS path, dependent.module AS module, dependent.layer AS layer, hops
      ORDER BY hops ASC, path ASC
      `,
      { path },
    );
  }


  async getDependencies(path: string, maxHops: number): Promise<TraversalNode[]> {
    await this.getFileSummary(path);

    return this.neo4j.read<TraversalNode>(
      `
      MATCH p = (source:File {path: $path})-[:IMPORTS*1..${maxHops}]->(dep:File)
      WITH dep, min(length(p)) AS hops
      RETURN dep.path AS path, dep.module AS module, dep.layer AS layer, hops
      ORDER BY hops ASC, path ASC
      `,
      { path },
    );
  }


  async getImpactGraph(
    path: string,
    maxHops: number,
    direction: 'dependents' | 'dependencies',
  ): Promise<{ target: string; direction: string; nodes: TraversalNode[]; edges: { from: string; to: string }[] }> {
    const nodes =
      direction === 'dependents'
        ? await this.getBlastRadius(path, maxHops)
        : await this.getDependencies(path, maxHops);

    const allPaths = [path, ...nodes.map((n) => n.path)];

    const edges = await this.neo4j.read<{ from: string; to: string }>(
      `
      MATCH (a:File)-[:IMPORTS]->(b:File)
      WHERE a.path IN $paths AND b.path IN $paths
      RETURN a.path AS from, b.path AS to
      `,
      { paths: allPaths },
    );

    return { target: path, direction, nodes, edges };
  }
}
