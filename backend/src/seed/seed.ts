import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import neo4j from 'neo4j-driver';
import { parseRepo } from './parser';
import { loadIntoGraph } from './loader';
import { validateEnv } from '../common/config/env.schema';

function parseArgs(argv: string[]) {
  const args: { repo?: string; reset: boolean } = { reset: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--repo') args.repo = argv[i + 1];
    if (argv[i] === '--reset') args.reset = true;
  }
  return args;
}

async function main() {
  const { repo, reset } = parseArgs(process.argv.slice(2));
  if (!repo) {
    console.error('Usage: npm run seed -- --repo <path-to-target-repo> [--reset]');
    console.error('Example: npm run seed -- --repo ../BuyBuddy --reset');
    process.exit(1);
  }

  const repoPath = path.resolve(repo);
  const srcCandidate = path.join(repoPath, 'src');
  const rootDir = fs.existsSync(srcCandidate) ? srcCandidate : repoPath;

  console.log(`Parsing TypeScript files underr: ${rootDir}`);
  const result = parseRepo(rootDir);

  console.log(`Found ${result.files.length} files and ${result.packages.length} external packages`);
  console.log(`  ${result.importEdges.length} internal IMPORTS edges`);
  console.log(`  ${result.dependsEdges.length} DEPENDS_ON edges`);
  if (result.unresolved.length > 0) {
    console.warn(`  ${result.unresolved.length} unresolved relative imports:`);
    result.unresolved.forEach((u) => console.warn(`    ${u.file} -> ${u.specifier}`));
  }

  const env = validateEnv(process.env);
  const uri = env.COGNODB_URI;
  const user = env.COGNODB_USER;
  const password = env.COGNODB_PASSWORD;

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  try {
    await driver.verifyConnectivity();
    console.log('Connected to CognoDB. Loading graph...');
    await loadIntoGraph(driver, result, reset);
    console.log('Seed complete.');
  } finally {
    await driver.close();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
