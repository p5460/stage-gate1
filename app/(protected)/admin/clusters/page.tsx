import { getAllClusters } from "@/actions/clusters";
import { ClustersPageClient } from "@/components/admin/clusters-page-client";
import { BackButton } from "@/components/ui/back-button";

export default async function ClustersPage() {
  const result = await getAllClusters();

  if (result.error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{result.error}</p>
      </div>
    );
  }

  const clusters = result.clusters || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/admin" label="Back to Admin" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cluster Management
          </h1>
          <p className="text-gray-600">
            Manage project clusters and categories
          </p>
        </div>
      </div>
      <ClustersPageClient clusters={clusters} />
    </div>
  );
}
