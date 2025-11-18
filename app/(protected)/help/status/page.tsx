import { SystemStatus } from "@/components/help/system-status";

export default function StatusPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Status</h1>
          <p className="text-gray-600">
            Real-time status of the CSIR Stage-Gate Platform and all its
            components
          </p>
        </div>
      </div>
      <SystemStatus />
    </div>
  );
}
