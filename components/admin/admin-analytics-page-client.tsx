"use client";

import { ModernAnalyticsDashboard } from "@/components/admin/modern-analytics-dashboard";
import { BackButton } from "@/components/ui/back-button";

export function AdminAnalyticsPageClient() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/admin" label="Back to Admin" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Analytics</h1>
          <p className="text-gray-600">
            System overview and performance metrics with export capabilities
          </p>
        </div>
      </div>
      <ModernAnalyticsDashboard />
    </div>
  );
}
