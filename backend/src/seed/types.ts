export interface FileNode {
  path: string; // POSIX path relative to the repo's src root, e.g. "modules/auth/auth.service.ts"
  module: string; // first meaningful path segment, e.g. "auth", "jobs", "config"
  layer: string; // inferred role from filename suffix, e.g. "service", "controller"
}

export interface PackageNode {
  name: string; // npm package name, e.g. "express" or "@prisma/client"
}

export interface ImportEdge {
  from: string; // File.path
  to: string; // File.path
}

export interface DependsEdge {
  from: string; // File.path
  to: string; // Package.name
}

export interface ParseResult {
  files: FileNode[];
  packages: PackageNode[];
  importEdges: ImportEdge[];
  dependsEdges: DependsEdge[];
  unresolved: { file: string; specifier: string }[];
}
