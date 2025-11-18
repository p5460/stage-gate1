"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Mail,
  AlertTriangle,
  FileText,
  Users,
  Calendar,
  BarChart3,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateNotificationPreferences,
  getNotificationPreferences,
} from "@/actions/notifications";

interface NotificationPreference {
  id: string;
  userId: string;
  emailNotifications: boolean;
  reviewAssignments: boolean;
  reviewSubmissions: boolean;
  projectUpdates: boolean;
  redFlagAlerts: boolean;
  documentUploads: boolean;
  statusChanges: boolean;
  milestoneReminders: boolean;
  weeklyDigest: boolean;
}

interface NotificationSettingsProps {
  preferences?: NotificationPreference;
}

export function NotificationSettings({
  preferences,
}: NotificationSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(!preferences);
  const [settings, setSettings] = useState({
    emailNotifications: preferences?.emailNotifications ?? true,
    reviewAssignments: preferences?.reviewAssignments ?? true,
    reviewSubmissions: preferences?.reviewSubmissions ?? true,
    projectUpdates: preferences?.projectUpdates ?? true,
    redFlagAlerts: preferences?.redFlagAlerts ?? true,
    documentUploads: preferences?.documentUploads ?? false,
    statusChanges: preferences?.statusChanges ?? true,
    milestoneReminders: preferences?.milestoneReminders ?? true,
    weeklyDigest: preferences?.weeklyDigest ?? false,
  });

  // Load preferences if not provided
  useEffect(() => {
    if (!preferences) {
      const loadPreferences = async () => {
        try {
          const result = await getNotificationPreferences();
          if (result.success && result.preferences) {
            setSettings({
              emailNotifications: result.preferences.emailNotifications ?? true,
              reviewAssignments: result.preferences.reviewAssignments ?? true,
              reviewSubmissions: result.preferences.reviewSubmissions ?? true,
              projectUpdates: result.preferences.projectUpdates ?? true,
              redFlagAlerts: result.preferences.redFlagAlerts ?? true,
              documentUploads: result.preferences.documentUploads ?? false,
              statusChanges: result.preferences.statusChanges ?? true,
              milestoneReminders: result.preferences.milestoneReminders ?? true,
              weeklyDigest: result.preferences.weeklyDigest ?? false,
            });
          }
        } catch (error) {
          console.error("Failed to load notification preferences:", error);
          toast.error("Failed to load notification preferences");
        } finally {
          setIsLoading(false);
        }
      };
      loadPreferences();
    }
  }, [preferences]);

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await updateNotificationPreferences(settings);
        if (result.success) {
          toast.success("Notification preferences updated successfully");
        } else {
          toast.error(result.error || "Failed to update preferences");
        }
      } catch (error) {
        toast.error("An error occurred while updating preferences");
      }
    });
  };

  type NotificationSettingKey = keyof typeof settings;

  const notificationCategories: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
    settings: Array<{
      key: NotificationSettingKey;
      label: string;
      description: string;
    }>;
  }> = [
    {
      title: "Review Notifications",
      description: "Notifications related to project reviews and assignments",
      icon: <Users className="h-5 w-5" />,
      settings: [
        {
          key: "reviewAssignments",
          label: "Review Assignments",
          description: "When you are assigned to review a project",
        },
        {
          key: "reviewSubmissions",
          label: "Review Submissions",
          description: "When reviews are submitted for your projects",
        },
      ],
    },
    {
      title: "Project Updates",
      description: "Notifications about project changes and progress",
      icon: <BarChart3 className="h-5 w-5" />,
      settings: [
        {
          key: "projectUpdates",
          label: "Project Updates",
          description: "General project updates and changes",
        },
        {
          key: "statusChanges",
          label: "Status Changes",
          description: "When project status or stage changes",
        },
        {
          key: "milestoneReminders",
          label: "Milestone Reminders",
          description: "Reminders about upcoming milestones",
        },
      ],
    },
    {
      title: "Alerts & Documents",
      description: "Important alerts and document notifications",
      icon: <AlertTriangle className="h-5 w-5" />,
      settings: [
        {
          key: "redFlagAlerts",
          label: "Red Flag Alerts",
          description: "When red flags are raised on projects",
        },
        {
          key: "documentUploads",
          label: "Document Uploads",
          description: "When new documents are uploaded to projects",
        },
      ],
    },
    {
      title: "Digest & Summary",
      description: "Periodic summaries and digest emails",
      icon: <Calendar className="h-5 w-5" />,
      settings: [
        {
          key: "weeklyDigest",
          label: "Weekly Digest",
          description: "Weekly summary of project activities",
        },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Manage how and when you receive notifications about project
              activities
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading notification preferences...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Manage how and when you receive notifications about project
            activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Email Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <Label
                  htmlFor="emailNotifications"
                  className="text-base font-medium"
                >
                  Email Notifications
                </Label>
                <p className="text-sm text-gray-600">
                  Master toggle for all email notifications
                </p>
              </div>
            </div>
            <Switch
              id="emailNotifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                handleSettingChange("emailNotifications", checked)
              }
            />
          </div>

          {/* Notification Categories */}
          {notificationCategories.map((category, categoryIndex) => (
            <div key={category.title}>
              <div className="flex items-center gap-2 mb-4">
                {category.icon}
                <div>
                  <h3 className="font-medium text-gray-900">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3 ml-7">
                {category.settings.map((setting) => (
                  <div
                    key={setting.key}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <Label
                        htmlFor={setting.key}
                        className={`text-sm font-medium ${
                          !settings.emailNotifications
                            ? "text-gray-400"
                            : "text-gray-900"
                        }`}
                      >
                        {setting.label}
                      </Label>
                      <p
                        className={`text-xs ${
                          !settings.emailNotifications
                            ? "text-gray-400"
                            : "text-gray-600"
                        }`}
                      >
                        {setting.description}
                      </p>
                    </div>
                    <Switch
                      id={setting.key}
                      checked={
                        settings.emailNotifications && settings[setting.key]
                      }
                      onCheckedChange={(checked) =>
                        handleSettingChange(setting.key, checked)
                      }
                      disabled={!settings.emailNotifications}
                    />
                  </div>
                ))}
              </div>

              {categoryIndex < notificationCategories.length - 1 && (
                <Separator className="mt-6" />
              )}
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch("/api/test-notification", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  });

                  if (response.ok) {
                    toast.success("Test notification sent! Check your email.");
                  } else {
                    const error = await response.json();
                    toast.error(
                      error.error || "Failed to send test notification"
                    );
                  }
                } catch (error) {
                  toast.error("Failed to send test notification");
                }
              }}
              disabled={isPending || !settings.emailNotifications}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Test Email
            </Button>

            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notification Preview
          </CardTitle>
          <CardDescription>
            Based on your current settings, you will receive notifications for:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings)
              .filter(
                ([key, value]) =>
                  key !== "emailNotifications" &&
                  value &&
                  settings.emailNotifications
              )
              .map(([key]) => {
                const setting = notificationCategories
                  .flatMap((cat) => cat.settings)
                  .find((s) => s.key === (key as NotificationSettingKey));

                return setting ? (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {setting.label}
                  </div>
                ) : null;
              })}

            {!settings.emailNotifications && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                No email notifications enabled
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
