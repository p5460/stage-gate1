import { HelpCenter } from "@/components/help/help-center";

export default function KnowledgeBasePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-600">
            Find answers to your questions, browse our knowledge base, or
            contact support for assistance
          </p>
        </div>
      </div>
      <HelpCenter />
    </div>
  );
}
