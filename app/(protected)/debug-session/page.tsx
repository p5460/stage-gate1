import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";

export default async function DebugSessionPage() {
  const session = await auth();

  let dbUser = null;
  if (session?.user?.email) {
    dbUser = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/dashboard" label="Back to Dashboard" />
        <h1 className="text-2xl font-bold">Session Debug</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database User</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(dbUser, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
