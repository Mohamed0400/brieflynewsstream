import { OpsPanelSkeleton } from "@/components/console/ops/OpsCharts";

export default function AdminOperationsLoading() {
  return (
    <div className="console-page ops-page-loading" aria-busy="true">
      <div className="ops-page-loading-header">
        <span className="ops-skeleton-line ops-skeleton-kicker" />
        <span className="ops-skeleton-line ops-skeleton-title" />
        <span className="ops-skeleton-line ops-skeleton-desc" />
      </div>
      <OpsPanelSkeleton rows={6} />
    </div>
  );
}
