import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { FileNode, ParseResult } from './types';

// suffix -> layer, checked longest/most-specific first.
const LAYER_SUFFIXES: [string, string][] = [
  ['.controller.ts', 'controller'],
  ['.routes.ts', 'route'],
  ['.route.ts', 'route'],
  ['.validation.ts', 'validation'],
  ['.service.ts', 'service'],
  ['.select.ts', 'select'],
  ['.interface.ts', 'type'],
  ['.type.ts', 'type'],
  ['.middleware.ts', 'middleware'],
  ['.gateway.ts', 'gateway'],
  ['.worker.ts', 'worker'],
  ['.processor.ts', 'processor'],
  ['.queue.ts', 'queue'],
  ['.job.ts', 'job'],
  ['.config.ts', 'config'],
  ['.enum.ts', 'enum'],
  ['.setup.ts', 'setup'],
  ['.event.ts', 'event'],
  ['.util.ts', 'util'],
  ['.utilites.ts', 'util'],
  ['.utills.ts', 'util'],
];

// folders that are generic wrappers — the interesting module name is one
// level below them (modules/auth/... -> "auth", services/email/... -> "email").
const WRAPPER_DIRS = new Set(['modules', 'services']);

function inferLayer(fileName: string): string {
  for (const [suffix, layer] of LAYER_SUFFIXES) {
    if (fileName.endsWith(suffix)) return layer;
  }
  if (fileName === 'index.ts') return 'index';
  if (fileName === 'app.ts' || fileName === 'server.ts') return 'entry';
  return 'other';
}

function inferModule(relPath: string): string {
  const segments = relPath.split('/');
  if (segments.length === 1) return 'root';
  const [first] = segments;
  if (WRAPPER_DIRS.has(first) && segments.length > 2) {
    return segments[1];
  }
  return first;
}

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

function walkTsFiles(rootDir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
      results.push(...walkTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

function packageNameFromSpecifier(spec: string): string {
  if (spec.startsWith('@')) {
    return spec.split('/').slice(0, 2).join('/');
  }
  return spec.split('/')[0];
}

function resolveRelativeImport(fromFileAbs: string, specifier: string, rootDir: string): string | null {
  const fromDir = path.dirname(fromFileAbs);
  const base = path.resolve(fromDir, specifier);
  const candidates = [base.endsWith('.ts') ? base : `${base}.ts`, path.join(base, 'index.ts')];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return toPosix(path.relative(rootDir, candidate));
    }
  }
  return null;
}

function extractModuleSpecifiers(sourceFile: ts.SourceFile): string[] {
  const specifiers: string[] = [];
  sourceFile.forEachChild((node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
  });
  return specifiers;
}

export function parseRepo(rootDir: string): ParseResult {
  const absoluteRoot = path.resolve(rootDir);
  const allFiles = walkTsFiles(absoluteRoot);

  const files: FileNode[] = allFiles.map((abs) => {
    const relPath = toPosix(path.relative(absoluteRoot, abs));
    return { path: relPath, module: inferModule(relPath), layer: inferLayer(path.basename(relPath)) };
  });

  const packagesSeen = new Set<string>();
  const dependsSeen = new Set<string>();
  const importEdges: ParseResult['importEdges'] = [];
  const dependsEdges: ParseResult['dependsEdges'] = [];
  const unresolved: ParseResult['unresolved'] = [];

  for (const abs of allFiles) {
    const relPath = toPosix(path.relative(absoluteRoot, abs));
    const sourceText = fs.readFileSync(abs, 'utf-8');
    const sourceFile = ts.createSourceFile(abs, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

    for (const spec of extractModuleSpecifiers(sourceFile)) {
      if (spec.startsWith('.')) {
        const resolved = resolveRelativeImport(abs, spec, absoluteRoot);
        if (resolved) {
          importEdges.push({ from: relPath, to: resolved });
        } else {
          unresolved.push({ file: relPath, specifier: spec });
        }
      } else {
        const pkgName = packageNameFromSpecifier(spec);
        packagesSeen.add(pkgName);
        const key = `${relPath}::${pkgName}`;
        if (!dependsSeen.has(key)) {
          dependsSeen.add(key);
          dependsEdges.push({ from: relPath, to: pkgName });
        }
      }
    }
  }

  return {
    files,
    packages: Array.from(packagesSeen).map((name) => ({ name })),
    importEdges,
    dependsEdges,
    unresolved,
  };
}
