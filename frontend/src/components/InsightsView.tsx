import { HotspotsPanel } from './HotspotsPanel';
import { CyclesPanel } from './CyclesPanel';
import { ModuleCouplingPanel } from './ModuleCouplingPanel';
import { PackageImpactPanel } from './PackageImpactPanel';

export function InsightsView() {
  return (
    <div className="insights-view">
      <div className="insights-view__grid">
        <HotspotsPanel />
        <CyclesPanel />
        <ModuleCouplingPanel />
        <PackageImpactPanel />
      </div>
    </div>
  );
}
