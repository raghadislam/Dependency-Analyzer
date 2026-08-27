import { Driver } from 'neo4j-driver';
import { ParseResult } from './types';

export async function loadIntoGraph(driver: Driver, data: ParseResult, reset: boolean): Promise<void> {
  const session = driver.session();
  try {
    if (reset) {
      await session.executeWrite((tx) => tx.run('MATCH (n) DETACH DELETE n'));
    }

    // constraints are best-effort: some managed tiers restrict DDL, so a
    // missing-permission error here shouldn't abort the whole seed run.
    try {
      await session.executeWrite((tx) =>
        tx.run('CREATE CONSTRAINT file_path_unique IF NOT EXISTS FOR (f:File) REQUIRE f.path IS UNIQUE'),
      );
      await session.executeWrite((tx) =>
        tx.run('CREATE CONSTRAINT package_name_unique IF NOT EXISTS FOR (p:Package) REQUIRE p.name IS UNIQUE'),
      );
    } catch (err) {
      console.warn('Could not create constraints (continuing without them):', (err as Error).message);
    }

    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $rows AS row
        MERGE (f:File {path: row.path})
        SET f.module = row.module, f.layer = row.layer
        `,
        { rows: data.files },
      ),
    );

    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $rows AS row
        MERGE (p:Package {name: row.name})
        `,
        { rows: data.packages },
      ),
    );

    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $rows AS row
        MATCH (a:File {path: row.from}), (b:File {path: row.to})
        MERGE (a)-[:IMPORTS]->(b)
        `,
        { rows: data.importEdges },
      ),
    );

    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $rows AS row
        MATCH (a:File {path: row.from}), (p:Package {name: row.to})
        MERGE (a)-[:DEPENDS_ON]->(p)
        `,
        { rows: data.dependsEdges },
      ),
    );
  } finally {
    await session.close();
  }
}
