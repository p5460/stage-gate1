"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMainHelpPage = pathname === "/help";

  const getPageTitle = (pathname: string): string => {
    switch (pathname) {
      case "/help/api":
        return "API Documentation";
      case "/help/user-guide":
        return "User Guide";
      case "/help/tutorials":
        return "Video Tutorials";
      case "/help/status":
        return "System Status";
      case "/help/knowledge-base":
        return "Knowledge Base";
      case "/help/contact":
        return "Contact Support";
      default:
        return "Help";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              <Home className="h-4 w-4 inline mr-1" />
              <Link href="/help" className="hover:text-gray-700">
                Help Center
              </Link>
              {!isMainHelpPage && (
                <>
                  <span className="mx-2">›</span>
                  <span className="text-gray-900">
                    {getPageTitle(pathname)}
                  </span>
                </>
              )}
            </div>
          </div>
          <Link href="/help/contact">
            <Button variant="outline" size="sm">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
