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

export type Direction = 'dependents' | 'dependencies';

export interface ImpactGraph {
  target: string;
  direction: Direction;
  nodes: TraversalNode[];
  edges: { from: string; to: string }[];
}

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
