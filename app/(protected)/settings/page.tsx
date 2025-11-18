import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SettingsForm } from "@/components/settings/settings-form";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from "@/components/ui/back-button";

const SettingsPage = async () => {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Fetch user's notification preferences
  const notificationPreferences = await (
    db as any
  ).notificationPreference.findUnique({
    where: { userId: session.user.id! },
  });

  // Fetch user profile data
  const userProfile = await db.user.findUnique({
    where: { id: session.user.id! },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      department: true,
      position: true,
      phone: true,
      // bio: true, // TODO: Add bio field support
      isTwoFactorEnabled: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          projectsLed: true,
          projectMembers: true,
          gateReviews: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/dashboard" label="Back to Dashboard" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <SettingsForm />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <ProfileSettings user={userProfile} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings preferences={notificationPreferences} />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettings user={userProfile} />
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <ThemeSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
