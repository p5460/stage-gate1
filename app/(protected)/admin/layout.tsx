import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Role-based access control handled by individual pages

  return <div className="space-y-6">{children}</div>;
}
