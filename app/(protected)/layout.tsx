import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Toaster } from "@/components/ui/sonner";

export const dynamic = "force-dynamic";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Fetch user notifications
  const notifications = await db.notification.findMany({
    where: { userId: session.user.id! },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar user={session.user} />
      </div>

      {/* Mobile Sidebar - handled in Header component */}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          user={session.user}
          notifications={notifications}
          unreadCount={unreadCount}
        />

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-50">{children}</div>
      </div>
      <Toaster />
    </div>
  );
}
