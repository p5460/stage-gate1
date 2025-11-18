import { ButtonTest } from "@/components/test/button-test";
import { SimpleExportTest } from "@/components/test/simple-export-test";
import { BackButton } from "@/components/ui/back-button";

export default function TestButtonsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <BackButton href="/dashboard" label="Back to Dashboard" />
        <h1 className="text-2xl font-bold">Button Functionality Test</h1>
      </div>
      <ButtonTest />
      <SimpleExportTest projectId="test-project-123" />
    </div>
  );
}
