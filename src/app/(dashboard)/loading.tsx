import { LoadingState } from "@/components/common/loading-state";

export default function DashboardLoading() {
  return <LoadingState variant="skeleton" skeletonCount={4} className="p-1" />;
}
