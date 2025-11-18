import { APIDocumentation } from "@/components/help/api-documentation";

export default function APIDocsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            API Documentation
          </h1>
          <p className="text-gray-600">
            Complete reference for the CSIR Stage-Gate Platform REST API
          </p>
        </div>
      </div>
      <APIDocumentation />
    </div>
  );
}
