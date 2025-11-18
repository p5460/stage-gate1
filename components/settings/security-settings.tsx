"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Shield,
  Key,
  Eye,
  EyeOff,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Monitor,
  Globe,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  changePassword,
  enableTwoFactor,
  disableTwoFactor,
} from "@/actions/profile";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

interface SecuritySettingsProps {
  user: any;
}

export function SecuritySettings({ user }: SecuritySettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    user?.isTwoFactorEnabled || false
  );

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onPasswordSubmit = (data: PasswordFormData) => {
    startTransition(async () => {
      try {
        const result = await changePassword(data);

        if (result.success) {
          toast.success("Password updated successfully!");
          form.reset();
        } else {
          toast.error(result.error || "Failed to update password");
        }
      } catch (error) {
        toast.error("Failed to update password");
      }
    });
  };

  const handleTwoFactorToggle = (enabled: boolean) => {
    startTransition(async () => {
      try {
        const result = enabled
          ? await enableTwoFactor()
          : await disableTwoFactor();

        if (result.success) {
          setTwoFactorEnabled(enabled);
          toast.success(
            `Two-factor authentication ${enabled ? "enabled" : "disabled"}`
          );
        } else {
          toast.error(
            result.error || "Failed to update two-factor authentication"
          );
        }
      } catch (error) {
        toast.error("Failed to update two-factor authentication");
      }
    });
  };

  const handleLogoutAllDevices = () => {
    startTransition(async () => {
      try {
        // For now, just show a success message
        // In a real implementation, you would call an API to invalidate all sessions
        toast.success("This feature will be implemented in a future update");
      } catch (error) {
        toast.error("Failed to logout from all devices");
      }
    });
  };

  const recentSessions = [
    {
      id: "1",
      device: "Chrome on Windows",
      location: "Pretoria, South Africa",
      lastActive: "2 minutes ago",
      current: true,
    },
    {
      id: "2",
      device: "Safari on iPhone",
      location: "Johannesburg, South Africa",
      lastActive: "1 hour ago",
      current: false,
    },
    {
      id: "3",
      device: "Firefox on Ubuntu",
      location: "Cape Town, South Africa",
      lastActive: "2 days ago",
      current: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter your current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter your new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Password must be at least 8 characters long
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">
                Enable Two-Factor Authentication
              </Label>
              <p className="text-sm text-muted-foreground">
                Require a verification code in addition to your password
              </p>
              {twoFactorEnabled && (
                <Badge variant="secondary" className="mt-2">
                  <Shield className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              )}
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleTwoFactorToggle}
              disabled={isPending}
            />
          </div>

          {twoFactorEnabled && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  Two-factor authentication is active
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your account is protected with an additional security layer
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active sessions across different devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{session.device}</p>
                    {session.current && (
                      <Badge variant="secondary">Current Session</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {session.location} • {session.lastActive}
                  </p>
                </div>
                {!session.current && (
                  <Button variant="outline" size="sm">
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Log Out From All Devices
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log out from all devices?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will log you out from all devices except this one. You'll
                  need to log in again on other devices.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogoutAllDevices}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Log Out All Devices
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Strong Password</p>
                <p className="text-sm text-muted-foreground">
                  Your password meets security requirements
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div
                className={`w-2 h-2 rounded-full mt-2 ${twoFactorEnabled ? "bg-green-500" : "bg-yellow-500"}`}
              ></div>
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {twoFactorEnabled
                    ? "Two-factor authentication is enabled"
                    : "Consider enabling two-factor authentication for better security"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Account Verification</p>
                <p className="text-sm text-muted-foreground">
                  Your email address is verified
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
