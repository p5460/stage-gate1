import { UserGuide } from "@/components/help/user-guide";

export default function UserGuidePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Guide</h1>
          <p className="text-gray-600">
            Comprehensive guide to using the CSIR Stage-Gate Platform
            effectively
          </p>
        </div>
      </div>
      <UserGuide />
    </div>
  );
}
